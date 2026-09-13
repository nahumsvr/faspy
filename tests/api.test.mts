import assert from "node:assert/strict";
import { test } from "node:test";
import { GET as auditGet, OPTIONS as auditOptions } from "../app/api/compliance/audit/route.ts";
import { OPTIONS as emitirOptions, POST as emitirPost } from "../app/api/emitir-factura/route.ts";
import { OPTIONS as scoringOptions, POST as scoringPost } from "../app/api/scoring/simulate/route.ts";
import { apiJson, apiOptions, corsHeaders } from "../lib/api/response.ts";

const allowedOrigin = "http://localhost:3001";
const validUuid = "4a71d8be-b51f-46df-9a84-18ef5560965e";

const postRequest = (url: string, body: unknown, origin = allowedOrigin): Request =>
  new Request(url, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const readJson = async <T,>(response: Response): Promise<T> => await response.json() as T;

test("CORS permite solo el ERP configurado y conserva Vary", () => {
  const previous = process.env.ERP_ORIGIN;
  process.env.ERP_ORIGIN = "https://erp.example.test";
  try {
    const allowed = new Request("http://localhost/api", { headers: { Origin: "https://erp.example.test" } });
    assert.equal(corsHeaders(allowed).get("Access-Control-Allow-Origin"), "https://erp.example.test");
    for (const origin of ["https://unknown.test", "https://erp.example.test.attacker.test"]) {
      assert.equal(corsHeaders(new Request("http://localhost/api", { headers: { Origin: origin } })).has("Access-Control-Allow-Origin"), false);
    }
    assert.equal(corsHeaders(new Request("http://localhost/api")).get("Vary"), "Origin");
    assert.equal(apiOptions(allowed).status, 204);
    assert.equal(apiOptions(allowed).headers.get("Access-Control-Allow-Headers"), "Content-Type");
  } finally {
    if (previous === undefined) delete process.env.ERP_ORIGIN;
    else process.env.ERP_ORIGIN = previous;
  }
});

test("apiJson conserva estado y cuerpo JSON", async () => {
  const response = apiJson(new Request("http://localhost/api"), { error: { code: "INVALID", message: "Inválido" } }, 400);
  assert.equal(response.status, 400);
  assert.match(response.headers.get("Content-Type") ?? "", /application\/json/);
  assert.deepEqual(await response.json(), { error: { code: "INVALID", message: "Inválido" } });
});

test("emisión integra cumplimiento, scoring, oferta, ID estable y CLABE textual", async () => {
  const started = performance.now();
  const response = await emitirPost(postRequest("http://localhost/api/emitir-factura", {
    monto_mxn: 150000,
    cliente: "Distribuidora Industrial S.A. de C.V.",
    rfc_cliente: " din890214abc ",
    plazo_dias: 60,
    uuid_cfdi: validUuid.toUpperCase(),
  }));
  const elapsed = performance.now() - started;

  assert.ok(elapsed >= 650, `la emisión tardó ${elapsed.toFixed(0)} ms`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), allowedOrigin);
  assert.deepEqual(await readJson(response), {
    factura_id: `FAC-${validUuid}`,
    cfdi_status: "VIGENTE",
    efos_status: "LIMPIO",
    score: "ALTO",
    monto_anticipo: 132300,
    tasa_aplicada: 0.02,
    dias_promedio_pago: 32,
    clabe_virtual: "012180001234567890",
    decision: "aprobada",
  });
});

test("auditoría entrega los 18 registros precargados sin recalcularlos", async () => {
  const first = await auditGet(new Request("http://localhost/api/compliance/audit", {
    headers: { Origin: allowedOrigin },
  }));
  const second = await auditGet(new Request("http://localhost/api/compliance/audit", {
    headers: { Origin: allowedOrigin },
  }));
  const firstBody = await readJson<Record<string, unknown>[]>(first);
  const secondBody = await readJson<Record<string, unknown>[]>(second);

  assert.equal(first.status, 200);
  assert.equal(firstBody.length, 18);
  assert.deepEqual(firstBody, secondBody);
  assert.deepEqual(Object.keys(firstBody[0]).sort(), [
    "cfdi_status", "cliente", "decision", "efos_status", "id", "monto_mxn",
    "motivo_decision", "ofac_status", "plazo_dias", "rfc_cliente", "score", "timestamp", "uuid_cfdi",
  ]);
  assert.equal(firstBody[0].id, "FAC-2026-001");
  assert.equal(firstBody[0].plazo_dias, 60);
  assert.equal(firstBody[0].ofac_status, "LIMPIO");
  assert.equal(firstBody[0].motivo_decision, "CFDI vigente y RFC limpio; pagador A con exposición disponible.");
  assert.equal(first.headers.get("Access-Control-Allow-Origin"), allowedOrigin);
});

test("simulación recalcula de forma repetible y nunca oferta casos no aprobados", async () => {
  const cases = [
    {
      name: "aprobación conocida",
      input: { rfc_cliente: "DIN890214ABC", monto_mxn: 150000, plazo_dias: 60 },
      expected: { score: "ALTO", decision: "aprobada", dias_promedio_pago: 32, monto_anticipo: 132300, tasa_aplicada: 0.02 },
    },
    {
      name: "EFOS",
      input: { rfc_cliente: "CON950603VWX", monto_mxn: 100000, plazo_dias: 30 },
      expected: { score: "BAJO", decision: "rechazada", dias_promedio_pago: 110, monto_anticipo: 0, tasa_aplicada: 0 },
    },
    {
      name: "EDOS",
      input: { rfc_cliente: "MAN870119TUV", monto_mxn: 100000, plazo_dias: 30 },
      expected: { score: "BAJO", decision: "rechazada", dias_promedio_pago: 125, monto_anticipo: 0, tasa_aplicada: 0 },
    },
    {
      name: "OFAC",
      input: { rfc_cliente: "COM760315QRS", monto_mxn: 100000, plazo_dias: 30 },
      expected: { score: "ALTO", decision: "rechazada", dias_promedio_pago: 38, monto_anticipo: 0, tasa_aplicada: 0 },
    },
    {
      name: "pagador desconocido",
      input: { rfc_cliente: "XXX000101ABC", monto_mxn: 100000, plazo_dias: 90 },
      expected: { score: "BAJO", decision: "revision", dias_promedio_pago: 0, monto_anticipo: 0, tasa_aplicada: 0 },
    },
    {
      name: "revisión crediticia",
      input: { rfc_cliente: "SER930927DEF", monto_mxn: 100000, plazo_dias: 30 },
      expected: { score: "MEDIO", decision: "revision", dias_promedio_pago: 74, monto_anticipo: 0, tasa_aplicada: 0 },
    },
    {
      name: "límite excedido",
      input: { rfc_cliente: "DIN890214ABC", monto_mxn: 2500001, plazo_dias: 30 },
      expected: { score: "MEDIO", decision: "rechazada", dias_promedio_pago: 32, monto_anticipo: 0, tasa_aplicada: 0 },
    },
    {
      name: "RFC con sintaxis inválida",
      input: { rfc_cliente: "no-es-un-rfc", monto_mxn: 100000, plazo_dias: 30 },
      expected: { score: "BAJO", decision: "rechazada", dias_promedio_pago: 0, monto_anticipo: 0, tasa_aplicada: 0 },
    },
  ] as const;

  for (const current of cases) {
    const request = postRequest("http://localhost/api/scoring/simulate", current.input);
    const first = await scoringPost(request);
    const second = await scoringPost(postRequest("http://localhost/api/scoring/simulate", current.input));
    assert.equal(first.status, 200, current.name);
    assert.deepEqual(await readJson(first), current.expected, current.name);
    assert.deepEqual(await readJson(second), current.expected, current.name);
  }
});

test("emisión con UUID inválido sigue siendo una decisión de negocio HTTP 200 sin oferta", async () => {
  const response = await emitirPost(postRequest("http://localhost/api/emitir-factura", {
    monto_mxn: 100000,
    cliente: "Distribuidora Industrial S.A. de C.V.",
    rfc_cliente: "DIN890214ABC",
    plazo_dias: 30,
    uuid_cfdi: "not-a-uuid",
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    factura_id: "FAC-not-a-uuid",
    cfdi_status: "RECHAZADO",
    efos_status: "LIMPIO",
    score: "ALTO",
    monto_anticipo: 0,
    tasa_aplicada: 0,
    dias_promedio_pago: 32,
    clabe_virtual: "012180001234567890",
    decision: "rechazada",
  });
});

test("entradas inválidas devuelven ApiError 400 con CORS y sin latencia de emisión", async () => {
  const started = performance.now();
  const malformed = await emitirPost(new Request("http://localhost/api/emitir-factura", {
    method: "POST",
    headers: { Origin: allowedOrigin, "Content-Type": "application/json" },
    body: "{",
  }));
  const malformedElapsed = performance.now() - started;
  assert.equal(malformed.status, 400);
  assert.ok(malformedElapsed < 650, `la entrada inválida esperó ${malformedElapsed.toFixed(0)} ms`);
  assert.equal(malformed.headers.get("Access-Control-Allow-Origin"), allowedOrigin);
  assert.deepEqual(await readJson(malformed), {
    error: { code: "PETICION_INVALIDA", message: "El body debe ser JSON válido." },
  });

  const invalidAmount = await scoringPost(postRequest("http://localhost/api/scoring/simulate", {
    rfc_cliente: "DIN890214ABC", monto_mxn: "150000", plazo_dias: 60,
  }));
  assert.equal(invalidAmount.status, 400);
  assert.deepEqual(await readJson(invalidAmount), {
    error: { code: "MONTO_INVALIDO", message: "El monto debe ser positivo, finito y representable en centavos seguros." },
  });

  const missingField = await scoringPost(postRequest("http://localhost/api/scoring/simulate", {
    rfc_cliente: "DIN890214ABC", monto_mxn: 150000,
  }));
  assert.equal(missingField.status, 400);
  assert.deepEqual(await readJson(missingField), {
    error: { code: "PLAZO_INVALIDO", message: "El plazo debe ser 30, 60 o 90 días." },
  });
});

test("las tres rutas de negocio responden preflight y rechazan CORS desconocido", async () => {
  const preflights = [
    [emitirOptions, "POST"],
    [auditOptions, "GET"],
    [scoringOptions, "POST"],
  ] as const;
  for (const [options, method] of preflights) {
    const response = options(new Request("http://localhost/api", {
      method: "OPTIONS",
      headers: {
        Origin: allowedOrigin,
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": "Content-Type",
      },
    }));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), allowedOrigin);
    assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
  }

  const denied = await auditGet(new Request("http://localhost/api/compliance/audit", {
    headers: { Origin: "https://untrusted.invalid" },
  }));
  assert.equal(denied.status, 200);
  assert.equal(denied.headers.has("Access-Control-Allow-Origin"), false);
});

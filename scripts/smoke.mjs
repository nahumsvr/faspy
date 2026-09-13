import assert from "node:assert/strict";

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const origin = process.env.ERP_ORIGIN ?? "http://localhost:3001";
const request = (path, init) => fetch(new URL(path, base), { ...init, signal: AbortSignal.timeout(15000) });
const postJson = (path, body, requestOrigin = origin) => request(path, {
  method: "POST",
  headers: { Origin: requestOrigin, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const health = await request("/api/health", { headers: { Origin: origin } });
assert.equal(health.status, 200);
assert.equal(health.headers.get("Access-Control-Allow-Origin"), origin);
assert.deepEqual(await health.json(), { status: "ok", service: "faspy", mode: "simulation" });
const preflight = await request("/api/health", { method: "OPTIONS", headers: {
  Origin: origin, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "Content-Type",
} });
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
const denied = await request("/api/health", { headers: { Origin: "https://untrusted.invalid" } });
assert.equal(denied.headers.has("Access-Control-Allow-Origin"), false);

for (const [path, method] of [["/api/emitir-factura", "POST"], ["/api/compliance/audit", "GET"], ["/api/scoring/simulate", "POST"]]) {
  const response = await request(path, { method: "OPTIONS", headers: {
    Origin: origin,
    "Access-Control-Request-Method": method,
    "Access-Control-Request-Headers": "Content-Type",
  } });
  assert.equal(response.status, 204, path);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin, path);
}

const emissionStarted = performance.now();
const emission = await postJson("/api/emitir-factura", {
  monto_mxn: 150000,
  cliente: "Distribuidora Industrial S.A. de C.V.",
  rfc_cliente: " din890214abc ",
  plazo_dias: 60,
  uuid_cfdi: "4A71D8BE-B51F-46DF-9A84-18EF5560965E",
});
const emissionElapsed = performance.now() - emissionStarted;
assert.ok(emissionElapsed >= 650, `emisión demasiado rápida: ${emissionElapsed.toFixed(0)} ms`);
assert.equal(emission.status, 200);
assert.equal(emission.headers.get("Access-Control-Allow-Origin"), origin);
assert.deepEqual(await emission.json(), {
  factura_id: "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e",
  cfdi_status: "VIGENTE",
  efos_status: "LIMPIO",
  score: "ALTO",
  monto_anticipo: 132300,
  tasa_aplicada: 0.02,
  dias_promedio_pago: 32,
  clabe_virtual: "012180001234567890",
  decision: "aprobada",
});

const audit = await request("/api/compliance/audit", { headers: { Origin: origin } });
assert.equal(audit.status, 200);
assert.equal(audit.headers.get("Access-Control-Allow-Origin"), origin);
const auditBody = await audit.json();
assert.equal(auditBody.length, 18);
assert.equal(auditBody[0].id, "FAC-2026-001");
assert.equal(auditBody[0].plazo_dias, 60);
assert.equal(auditBody[0].ofac_status, "LIMPIO");

const scoringInput = { rfc_cliente: "DIN890214ABC", monto_mxn: 150000, plazo_dias: 60 };
const scoring = await postJson("/api/scoring/simulate", scoringInput);
assert.equal(scoring.status, 200);
const scoringBody = await scoring.json();
assert.deepEqual(scoringBody, {
  score: "ALTO", decision: "aprobada", dias_promedio_pago: 32,
  monto_anticipo: 132300, tasa_aplicada: 0.02,
});
const scoringRepeat = await postJson("/api/scoring/simulate", scoringInput);
assert.deepEqual(await scoringRepeat.json(), scoringBody);

const ofac = await postJson("/api/scoring/simulate", {
  rfc_cliente: "COM760315QRS", monto_mxn: 100000, plazo_dias: 30,
});
assert.equal(ofac.status, 200);
assert.deepEqual(await ofac.json(), {
  score: "ALTO", decision: "rechazada", dias_promedio_pago: 38,
  monto_anticipo: 0, tasa_aplicada: 0,
});

const unknown = await postJson("/api/scoring/simulate", {
  rfc_cliente: "XXX000101ABC", monto_mxn: 100000, plazo_dias: 90,
});
assert.equal(unknown.status, 200);
assert.deepEqual(await unknown.json(), {
  score: "BAJO", decision: "revision", dias_promedio_pago: 0,
  monto_anticipo: 0, tasa_aplicada: 0,
});

const rejected = await postJson("/api/emitir-factura", {
  monto_mxn: 100000,
  cliente: "Construcciones del Sureste S.A. de C.V.",
  rfc_cliente: "CON950603VWX",
  plazo_dias: 30,
  uuid_cfdi: "4a71d8be-b51f-46df-9a84-18ef5560965e",
});
assert.equal(rejected.status, 200);
const rejectedBody = await rejected.json();
assert.equal(rejectedBody.decision, "rechazada");
assert.equal(rejectedBody.efos_status, "SANCIONADO");
assert.equal(rejectedBody.monto_anticipo, 0);
assert.equal(rejectedBody.tasa_aplicada, 0);
assert.equal(rejectedBody.clabe_virtual, "012180001234567890");

const invalid = await postJson("/api/scoring/simulate", {
  rfc_cliente: "DIN890214ABC", monto_mxn: 150000, plazo_dias: 45,
});
assert.equal(invalid.status, 400);
assert.equal((await invalid.json()).error.code, "PLAZO_INVALIDO");

const deniedAudit = await request("/api/compliance/audit", { headers: { Origin: "https://untrusted.invalid" } });
assert.equal(deniedAudit.status, 200);
assert.equal(deniedAudit.headers.has("Access-Control-Allow-Origin"), false);
for (const path of ["/dashboard", "/dashboard/cumplimiento", "/dashboard/decision", "/dashboard/mercado"]) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), /Faspy/);
}
const root = await request("/", { redirect: "manual" });
assert.equal(root.status, 307);
assert.equal(root.headers.get("Location"), "/dashboard");
console.log("HTTP OK: health, emisión, auditoría, scoring, CORS, preflight, errores, dashboard y redirect.");

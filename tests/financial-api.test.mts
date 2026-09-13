import assert from "node:assert/strict";
import test from "node:test";
import { POST as emit } from "../app/api/emitir-factura/route.ts";
import { POST as accept } from "../app/api/aceptar-anticipo/route.ts";
import { POST as pay } from "../app/api/simular-pago/route.ts";
import { agreedScenario } from "../lib/engine/scenario.ts";

const origin = "http://localhost:3001";
const jsonRequest = (body: unknown, path = "http://localhost/api") =>
  new Request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });

test("POST emitir-factura devuelve la oferta plana y CORS", async () => {
  const started = performance.now();
  const response = await emit(jsonRequest(agreedScenario.invoice));
  assert.ok(performance.now() - started >= 650);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.deepEqual(await response.json(), agreedScenario.response);
});

test("POST emitir-factura rechaza JSON inválido y escenarios no acordados", async () => {
  const invalidJson = new Request("http://localhost/api/emitir-factura", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
  });
  assert.equal((await emit(invalidJson)).status, 400);
  const unsupported = await emit(jsonRequest({ ...agreedScenario.invoice, monto_mxn: 1 }));
  assert.equal(unsupported.status, 422);
  assert.deepEqual(await unsupported.json(), {
    error: { code: "SCENARIO_NOT_SUPPORTED", message: "Solo está habilitado el escenario sintético documentado." },
  });
});

test("aceptación y pago devuelven los resultados del caso acordado", async () => {
  const deposit = await accept(jsonRequest({ facturaId: "FAC-2026-001" }));
  assert.equal(deposit.status, 200);
  assert.deepEqual(await deposit.json(), {
    factura_id: "FAC-2026-001", estado: "FONDEADA",
    monto_depositado: 120000, fecha_deposito: "2026-09-13T10:00:00.000Z",
  });
  const payment = await pay(jsonRequest({ facturaId: "FAC-2026-001" }));
  assert.equal(payment.status, 200);
  assert.deepEqual(await payment.json(), agreedScenario.payment);
});

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

test("operaciones financieras rechazan JSON inválido e IDs ajenos al escenario", async () => {
  for (const handler of [accept, pay]) {
    const invalid = new Request("http://localhost/api", { method: "POST", body: "{" });
    assert.equal((await handler(invalid)).status, 400);
    assert.equal((await handler(jsonRequest({}))).status, 400);
    const unknown = await handler(jsonRequest({ facturaId: "no-soportada" }));
    assert.equal(unknown.status, 422);
    assert.equal((await unknown.json()).error.code, "SCENARIO_NOT_SUPPORTED");
  }
});

test("aceptación y pago devuelven los resultados del caso acordado", async () => {
  const deposit = await accept(jsonRequest({ facturaId: "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e" }));
  assert.equal(deposit.status, 200);
  assert.deepEqual(await deposit.json(), {
    factura_id: "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e", estado: "FONDEADA",
    monto_depositado: 132300, fecha_deposito: "2026-09-13T10:00:00.000Z",
  });
  const payment = await pay(jsonRequest({ facturaId: "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e" }));
  assert.equal(payment.status, 200);
  assert.deepEqual(await payment.json(), agreedScenario.payment);
});

test("emisión, anticipo y liquidación conservan importes e identificador", async () => {
  const emission = await (await emit(jsonRequest(agreedScenario.invoice))).json();
  const deposit = await (await accept(jsonRequest({ facturaId: emission.factura_id }))).json();
  const payment = await (await pay(jsonRequest({ facturaId: emission.factura_id }))).json();
  assert.equal(deposit.monto_depositado, emission.monto_anticipo);
  assert.equal(payment.principal_retenido, deposit.monto_depositado);
  assert.equal(payment.principal_retenido + payment.comision_cobrada + payment.remanente_dispersado, agreedScenario.invoice.monto_mxn);
});

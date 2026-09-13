import assert from "node:assert/strict";

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const origin = process.env.ERP_ORIGIN ?? "http://localhost:3001";
const request = (path, init) => fetch(new URL(path, base), { ...init, signal: AbortSignal.timeout(15000) });
const health = await request("/api/health", { headers: { Origin: origin } });
assert.equal(health.status, 200);
assert.equal(health.headers.get("Access-Control-Allow-Origin"), origin);
assert.deepEqual(await health.json(), { status: "ok", service: "ecostream", mode: "simulation" });
const preflight = await request("/api/health", { method: "OPTIONS", headers: {
  Origin: origin, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "Content-Type",
} });
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
const denied = await request("/api/health", { headers: { Origin: "https://untrusted.invalid" } });
assert.equal(denied.headers.has("Access-Control-Allow-Origin"), false);
const invoice = {
  monto_mxn: 150000,
  cliente: "Distribuidora Industrial S.A. de C.V.",
  rfc_cliente: "DIN890214ABC",
  plazo_dias: 60,
  uuid_cfdi: "4a71d8be-b51f-46df-9a84-18ef5560965e",
};
const emitted = await request("/api/emitir-factura", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify(invoice),
});
assert.equal(emitted.status, 200);
assert.deepEqual(await emitted.json(), {
  factura_id: "FAC-2026-001",
  cfdi_status: "VIGENTE",
  efos_status: "LIMPIO",
  score: "ALTO",
  monto_anticipo: 120000,
  tasa_aplicada: 0.02,
  dias_promedio_pago: 45,
  clabe_virtual: "012180001234567890",
  decision: "aprobada",
});
const deposit = await request("/api/aceptar-anticipo", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ facturaId: "FAC-2026-001" }),
});
assert.equal(deposit.status, 200);
assert.equal((await deposit.json()).estado, "FONDEADA");
const payment = await request("/api/simular-pago", {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ facturaId: "FAC-2026-001" }),
});
assert.equal(payment.status, 200);
assert.deepEqual(await payment.json(), {
  factura_id: "FAC-2026-001",
  principal_retenido: 120000,
  comision_cobrada: 3000,
  remanente_dispersado: 27000,
  margen_neto_pct: 0.02,
});
for (const path of ["/dashboard", "/dashboard/cumplimiento", "/dashboard/decision", "/dashboard/mercado"]) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), /EcoStream/);
}
const root = await request("/", { redirect: "manual" });
assert.equal(root.status, 307);
assert.equal(root.headers.get("Location"), "/dashboard");
console.log("HTTP OK: health, CORS, preflight, emisión, anticipo, pago, dashboard y redirect.");

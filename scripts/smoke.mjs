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
for (const path of ["/dashboard", "/dashboard/cumplimiento", "/dashboard/decision", "/dashboard/mercado"]) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), /EcoStream/);
}
const root = await request("/", { redirect: "manual" });
assert.equal(root.status, 307);
assert.equal(root.headers.get("Location"), "/dashboard");
console.log("HTTP OK: health, CORS, preflight, dashboard y redirect.");

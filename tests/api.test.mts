import assert from "node:assert/strict";
import { test } from "node:test";
import { apiJson, apiOptions, corsHeaders } from "../lib/api/response.ts";

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

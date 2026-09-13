import assert from "node:assert/strict";
import test from "node:test";
import { validateCompliance } from "../lib/engine/compliance.ts";
import { offerFor, paymentFor } from "../lib/engine/factoring.ts";
import { agreedScenario, depositFor, sameInvoice } from "../lib/engine/scenario.ts";
import { scoreInvoice } from "../lib/engine/scoring.ts";
import type { EmitirFacturaRequest } from "../types/schema.ts";

test("el motor devuelve exactamente el escenario acordado", () => {
  assert.equal(sameInvoice(agreedScenario.invoice), true);
  assert.deepEqual(validateCompliance(agreedScenario.invoice), {
    cfdi_status: "VIGENTE", efos_status: "LIMPIO",
  });
  assert.deepEqual(scoreInvoice(agreedScenario.invoice), {
    score: "ALTO", decision: "aprobada", dias_promedio_pago: 45,
  });
  assert.deepEqual(offerFor(agreedScenario.invoice), agreedScenario.response);
  assert.deepEqual(depositFor("FAC-2026-001"), {
    factura_id: "FAC-2026-001", estado: "FONDEADA",
    monto_depositado: 120000, fecha_deposito: "2026-09-13T10:00:00.000Z",
  });
  assert.deepEqual(paymentFor("FAC-2026-001"), agreedScenario.payment);
});

test("el motor no extrapola reglas a entradas distintas", () => {
  const other: EmitirFacturaRequest = {
    ...agreedScenario.invoice, monto_mxn: 1,
  };
  assert.equal(sameInvoice(other), false);
  assert.equal(scoreInvoice(other), undefined);
  assert.equal(offerFor(other), undefined);
  assert.equal(validateCompliance(other), undefined);
  assert.equal(depositFor("FAC-2026-999"), undefined);
  assert.equal(paymentFor("FAC-2026-999"), undefined);
});

import type { EmitirFacturaRequest, ScoringDecision } from "../../types/schema.ts";
import { agreedScenario, sameInvoice } from "./scenario.ts";

export interface ScoringResult {
  score: "ALTO" | "MEDIO" | "BAJO";
  decision: ScoringDecision;
  dias_promedio_pago: number;
}

/** Devuelve el resultado documentado y no extrapola umbrales a otras entradas. */
export function scoreInvoice(invoice: EmitirFacturaRequest): ScoringResult | undefined {
  if (!sameInvoice(invoice)) return undefined;
  const { score, decision, dias_promedio_pago } = agreedScenario.response;
  if (!decision) return undefined;
  return {
    score, decision, dias_promedio_pago,
  };
}

import type { EmitirFacturaRequest, ComplianceReport } from "../../types/schema.ts";
import { sameInvoice } from "./scenario.ts";

/** Valida solamente el caso sintético acordado; no consulta SAT, EFOS, OFAC ni SPEI reales. */
export function validateCompliance(invoice: EmitirFacturaRequest): ComplianceReport | undefined {
  if (!sameInvoice(invoice)) return undefined;
  return { cfdi_status: "VIGENTE", efos_status: "LIMPIO" };
}

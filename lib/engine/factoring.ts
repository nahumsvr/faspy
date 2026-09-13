import type { EmitirFacturaRequest, EmitirFacturaResponse, ResultadoPago } from "../../types/schema.ts";
import { agreedScenario, sameInvoice } from "./scenario.ts";

export function offerFor(invoice: EmitirFacturaRequest): EmitirFacturaResponse | undefined {
  return sameInvoice(invoice) ? { ...agreedScenario.response } : undefined;
}

export function paymentFor(facturaId: string): ResultadoPago | undefined {
  return facturaId === agreedScenario.payment.factura_id ? { ...agreedScenario.payment } : undefined;
}

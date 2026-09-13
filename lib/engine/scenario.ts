import scenario from "../data/scenario.json" with { type: "json" };
import type {
  AnticipoConfirmado, EmitirFacturaRequest, EmitirFacturaResponse, ResultadoPago,
} from "../../types/schema.ts";

export const agreedScenario = scenario as {
  invoice: EmitirFacturaRequest;
  response: EmitirFacturaResponse;
  payment: ResultadoPago;
  depositDate: string;
};

export function sameInvoice(left: EmitirFacturaRequest, right = agreedScenario.invoice): boolean {
  return left.monto_mxn === right.monto_mxn
    && left.cliente === right.cliente
    && left.rfc_cliente === right.rfc_cliente
    && left.plazo_dias === right.plazo_dias
    && left.uuid_cfdi === right.uuid_cfdi;
}

export function depositFor(facturaId: string): AnticipoConfirmado | undefined {
  if (facturaId !== agreedScenario.response.factura_id) return undefined;
  return {
    factura_id: facturaId,
    estado: "FONDEADA",
    monto_depositado: agreedScenario.response.monto_anticipo,
    fecha_deposito: agreedScenario.depositDate,
  };
}

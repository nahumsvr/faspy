import assert from "node:assert/strict";
import test from "node:test";
import type {
  AceptarAnticipoRequest,
  AnticipoConfirmado,
  ComplianceReport,
  EmitirFacturaRequest,
  EmitirFacturaResponse,
  Factura,
  InvoiceCFDI,
  ResultadoPago,
  ScoringDecision,
  SimularPagoRequest,
  ValidacionFactura,
} from "../types/schema.ts";

// Verificaciones estáticas de compatibilidad
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

export type ClabeIsString = Assert<Equal<EmitirFacturaResponse["clabe_virtual"], string>>;
export type DecisionValues = Assert<Equal<ScoringDecision, "aprobada" | "revision" | "rechazada">>;
export type RequestIsInvoice = Assert<Equal<EmitirFacturaRequest, InvoiceCFDI>>;
export type FacturaAlias = Assert<Equal<Factura, InvoiceCFDI>>;
export type ValidacionAlias = Assert<Equal<ValidacionFactura, EmitirFacturaResponse>>;
export type ReportFields = Assert<Equal<keyof ComplianceReport, "cfdi_status" | "efos_status">>;

test("InvoiceCFDI valida campos requeridos por el ERP", () => {
  const invoice: InvoiceCFDI = {
    monto_mxn: 150000,
    cliente: "Comercializadora del Norte S.A. de C.V.",
    rfc_cliente: "CNO980112XYZ",
    plazo_dias: 60,
    uuid_cfdi: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  };

  const request: EmitirFacturaRequest = invoice;
  assert.equal(request.monto_mxn, 150000);
  assert.equal(request.rfc_cliente, "CNO980112XYZ");
});

test("EmitirFacturaResponse incluye cumplimiento y oferta plana de factoraje", () => {
  const response: EmitirFacturaResponse = {
    factura_id: "FAC-2026-001",
    cfdi_status: "VIGENTE",
    efos_status: "LIMPIO",
    score: "ALTO",
    monto_anticipo: 120000,
    tasa_aplicada: 0.02,
    dias_promedio_pago: 45,
    clabe_virtual: "012180001234567890",
    decision: "aprobada",
  };

  assert.equal(response.cfdi_status, "VIGENTE");
  assert.equal(response.efos_status, "LIMPIO");
  assert.equal(response.decision, "aprobada");
  assert.equal(response.score, "ALTO");
});

test("CLABE virtual conserva ceros iniciales como string al serializar JSON", () => {
  const clabeWithZeros: EmitirFacturaResponse["clabe_virtual"] = "000123456789012345";
  const serialized = JSON.stringify({ clabe_virtual: clabeWithZeros });
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.clabe_virtual, "000123456789012345");
  assert.equal(typeof parsed.clabe_virtual, "string");
});

test("Fases posteriores: Aceptar anticipo y simular liquidación", () => {
  const anticipoReq: AceptarAnticipoRequest = { facturaId: "FAC-2026-001" };
  const anticipoConfirmado: AnticipoConfirmado = {
    factura_id: anticipoReq.facturaId,
    estado: "FONDEADA",
    monto_depositado: 120000,
    fecha_deposito: "2026-09-13T10:00:00Z",
  };
  assert.equal(anticipoConfirmado.estado, "FONDEADA");

  const simularReq: SimularPagoRequest = { facturaId: "FAC-2026-001" };
  const resultadoPago: ResultadoPago = {
    factura_id: simularReq.facturaId,
    principal_retenido: 120000,
    comision_cobrada: 3000,
    remanente_dispersado: 27000,
    margen_neto_pct: 0.02,
  };
  assert.equal(resultadoPago.remanente_dispersado, 27000);
});

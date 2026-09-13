/** Infraestructura inicial. */
export interface HealthResponse {
  status: "ok";
  service: "faspy";
  mode: "simulation";
}

export interface ApiError {
  error: { code: string; message: string };
}

/**
 * Factura de entrada emitida desde el ERP.
 * Los importes y plazos se envían sin cálculo financiero local.
 */
export interface InvoiceCFDI {
  monto_mxn: number;
  cliente: string;
  rfc_cliente: string;
  plazo_dias: number;
  /** UUID del CFDI con formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. */
  uuid_cfdi: string;
}

/** POST /api/emitir-factura: body directo plano, sin envoltorio adicional. */
export type EmitirFacturaRequest = InvoiceCFDI;

/** Campos de compliance planos de la respuesta; no es un objeto JSON anidado. */
export interface ComplianceReport {
  cfdi_status: "VIGENTE" | "RECHAZADO";
  efos_status: "LIMPIO" | "SANCIONADO";
}

/**
 * Vocabulario acordado de decisión de factoraje.
 */
export type ScoringDecision = "aprobada" | "revision" | "rechazada";

/** POST /api/emitir-factura: respuesta plana acordada con el ERP. */
export interface EmitirFacturaResponse extends ComplianceReport {
  factura_id: string;
  score: "ALTO" | "MEDIO" | "BAJO";
  monto_anticipo: number;
  /** Fracción recibida del core: 0.02 representa 2 %, según la planeación. */
  tasa_aplicada: number;
  dias_promedio_pago: number;
  /** Cadena literal: nunca convertir a number, para conservar ceros iniciales. */
  clabe_virtual: string;
  /** Decisión opcional de scoring para enriquecimiento y vista del dashboard. */
  decision?: ScoringDecision;
}

/** Alias de compatibilidad con los nombres de la planeación original. */
export type Factura = InvoiceCFDI;
export type ValidacionFactura = EmitirFacturaResponse;

/** POST /api/aceptar-anticipo. Se conserva facturaId en camelCase según planeación ERP. */
export interface AceptarAnticipoRequest {
  facturaId: string;
}

export interface AnticipoConfirmado {
  factura_id: string;
  estado: "FONDEADA";
  monto_depositado: number;
  /** Fecha ISO recibida del core. */
  fecha_deposito: string;
}

/** POST /api/simular-pago. */
export interface SimularPagoRequest {
  facturaId: string;
}

export interface ResultadoPago {
  factura_id: string;
  principal_retenido: number;
  comision_cobrada: number;
  remanente_dispersado: number;
  /** Margen neto del factoraje (porcentaje). */
  margen_neto_pct: number;
}

/** Registro para el Centro de Cumplimiento y auditoría (/api/compliance/audit) */
export interface ComplianceAuditItem {
  id: string;
  uuid_cfdi: string;
  rfc_cliente: string;
  cliente: string;
  monto_mxn: number;
  cfdi_status: "VIGENTE" | "RECHAZADO";
  efos_status: "LIMPIO" | "SANCIONADO";
  score: "ALTO" | "MEDIO" | "BAJO";
  decision: ScoringDecision;
  timestamp: string;
}

import type { ComplianceReport, EmitirFacturaResponse, ScoringDecision } from "../../types/schema.ts";
import type { DebtorRecord, OfacStatus, SatClassification } from "../data/types.ts";

export type EngineReason =
  | "RFC_INVALIDO" | "CFDI_INVALIDO" | "SAT_DESCONOCIDO" | "EFOS" | "EDOS"
  | "OFAC_SANCIONADO" | "PAGADOR_DESCONOCIDO" | "PLAZO_60" | "PLAZO_90"
  | "EXPOSICION_MEDIA" | "EXPOSICION_ALTA" | "LIMITE_EXCEDIDO";

export interface ComplianceResult {
  rfc_cliente: string;
  cfdi_status: ComplianceReport["cfdi_status"];
  efos_status: ComplianceReport["efos_status"] | null;
  sat_clasificacion: SatClassification | null;
  ofac_status: OfacStatus;
  decision: ScoringDecision;
  motivos: EngineReason[];
}

export interface ScoringInput {
  pagador: Readonly<DebtorRecord> | null;
  monto_mxn: number;
  plazo_dias: number;
}

export interface ScoringResult {
  puntuacion: number | null;
  score: EmitirFacturaResponse["score"];
  decision: ScoringDecision;
  dias_promedio_pago: number | null;
  motivos: EngineReason[];
}

export interface FactoringConditions {
  aforo: number;
  tasa_aplicada: number;
  comision_mxn: number;
}

export interface FactoringResult extends FactoringConditions {
  monto_anticipo: number;
  descuento_mxn: number;
  reserva_mxn: number;
}

export type EngineErrorCode = "MONTO_INVALIDO" | "PLAZO_INVALIDO" | "PAGADOR_INVALIDO"
  | "AFORO_INVALIDO" | "TASA_INVALIDA" | "COMISION_INVALIDA";

export class EngineInputError extends Error {
  readonly code: EngineErrorCode;
  constructor(code: EngineErrorCode, message: string) {
    super(message);
    this.name = "EngineInputError";
    this.code = code;
  }
}

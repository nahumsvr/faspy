import type { ComplianceAuditItem } from "../../types/schema.ts";

/** Clasificación simplificada usada por el catálogo SAT 69-B de la demo. */
export type SatClassification = "LIMPIO" | "EFOS" | "EDOS";

/** Calificación crediticia precalculada para un pagador sintético. */
export type DebtorRating = "A" | "B" | "C" | "D";

/** Estado OFAC independiente del resultado fiscal SAT. */
export type OfacStatus = "LIMPIO" | "SANCIONADO";

/** Plazos cubiertos por los fixtures históricos. */
export type InvoiceTermDays = 30 | 60 | 90;

export interface Sat69bRecord {
  rfc: string;
  razon_social: string;
  clasificacion: SatClassification;
  motivo: string;
}

export interface OfacSanctionRecord {
  id: string;
  nombre: string;
  rfc: string;
  motivo: string;
}

export interface DebtorRecord {
  rfc: string;
  razon_social: string;
  calificacion: DebtorRating;
  dias_promedio_pago: number;
  facturas_pagadas: number;
  facturas_vencidas: number;
  limite_exposicion_mxn: number;
}

/** Auditoría precalculada; amplía el contrato compartido sin modificarlo. */
export interface InvoiceHistoryRecord extends ComplianceAuditItem {
  plazo_dias: InvoiceTermDays;
  ofac_status: OfacStatus;
  motivo_decision: string;
}

import type { InvoiceCFDI } from "../../types/schema.ts";
import type { DebtorRecord, OfacSanctionRecord, Sat69bRecord } from "../data/types.ts";
import type { ComplianceResult, EngineReason } from "./types.ts";

export function normalizeRfc(rfc: string): string {
  return rfc.trim().toUpperCase();
}

export function isValidRfc(value: unknown): value is string {
  return typeof value === "string" && /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(normalizeRfc(value));
}

export function isValidCfdiUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Solo sintaxis; no valida dígito verificador ni existencia de una cuenta. */
export function isValidClabe(value: unknown): value is string {
  return typeof value === "string" && /^\d{18}$/.test(value);
}

export function validateCompliance(
  invoice: Readonly<Pick<InvoiceCFDI, "rfc_cliente" | "uuid_cfdi">>,
  catalogs: {
    sat: readonly Readonly<Sat69bRecord>[];
    ofac: readonly Readonly<OfacSanctionRecord>[];
    debtors: readonly Readonly<DebtorRecord>[];
  },
): ComplianceResult {
  const rfc = typeof invoice.rfc_cliente === "string" ? normalizeRfc(invoice.rfc_cliente) : "";
  const validRfc = isValidRfc(rfc);
  const validCfdi = isValidCfdiUuid(invoice.uuid_cfdi);
  const sat = validRfc ? catalogs.sat.find((item) => normalizeRfc(item.rfc) === rfc) : undefined;
  const sanctioned = validRfc && catalogs.ofac.some((item) => normalizeRfc(item.rfc) === rfc);
  const debtor = validRfc && catalogs.debtors.some((item) => normalizeRfc(item.rfc) === rfc);
  const motivos: EngineReason[] = [];
  if (!validRfc) motivos.push("RFC_INVALIDO");
  if (!validCfdi) motivos.push("CFDI_INVALIDO");
  if (!sat) motivos.push("SAT_DESCONOCIDO");
  if (sat && sat.clasificacion !== "LIMPIO") motivos.push(sat.clasificacion);
  if (sanctioned) motivos.push("OFAC_SANCIONADO");
  if (!debtor) motivos.push("PAGADOR_DESCONOCIDO");
  const rejected = !validRfc || !validCfdi || sanctioned || (sat && sat.clasificacion !== "LIMPIO");
  return {
    rfc_cliente: rfc,
    cfdi_status: validCfdi ? "VIGENTE" : "RECHAZADO",
    efos_status: sat ? (sat.clasificacion === "LIMPIO" ? "LIMPIO" : "SANCIONADO") : null,
    sat_clasificacion: sat?.clasificacion ?? null,
    ofac_status: sanctioned ? "SANCIONADO" : "LIMPIO",
    decision: rejected ? "rechazada" : !sat || !debtor ? "revision" : "aprobada",
    motivos,
  };
}

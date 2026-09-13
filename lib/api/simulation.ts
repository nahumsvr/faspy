import sat from "../data/sat-69b.json" with { type: "json" };
import ofac from "../data/ofac-sanctions.json" with { type: "json" };
import debtors from "../data/debtors.json" with { type: "json" };
import type { DebtorRecord, Sat69bRecord } from "../data/types.ts";
import type { ApiError, EmitirFacturaRequest, EmitirFacturaResponse } from "../../types/schema.ts";
import { normalizeRfc, validateCompliance } from "../engine/compliance.ts";
import { calculateScoring } from "../engine/scoring.ts";
import { createFactoringOffer } from "../engine/factoring.ts";
import { EngineInputError } from "../engine/types.ts";
import { validateAmount, validateTerm } from "../engine/validation.ts";
import { apiJson } from "./response.ts";

export type SimulationRequest = Pick<EmitirFacturaRequest, "rfc_cliente" | "monto_mxn" | "plazo_dias">;
export type SimulationResponse = Pick<
  EmitirFacturaResponse,
  "score" | "decision" | "dias_promedio_pago" | "monto_anticipo" | "tasa_aplicada"
>;

export const VIRTUAL_CLABE = "012180001234567890";

class RequestError extends Error {}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function readInput(request: Request, invoice: true): Promise<EmitirFacturaRequest>;
export async function readInput(request: Request, invoice: false): Promise<SimulationRequest>;
export async function readInput(request: Request, invoice: boolean): Promise<SimulationRequest | EmitirFacturaRequest> {
  let body: unknown;
  try { body = await request.json(); } catch { throw new RequestError("El body debe ser JSON válido."); }

  if (!isJsonObject(body)
    || typeof body.rfc_cliente !== "string" || !body.rfc_cliente.trim()
    || (invoice && (typeof body.cliente !== "string" || !body.cliente.trim()
      || typeof body.uuid_cfdi !== "string" || !body.uuid_cfdi.trim()))) {
    throw new RequestError("Faltan campos requeridos o sus tipos son inválidos.");
  }

  // El motor conserva los códigos de dominio para monto y plazo. El resto de
  // la forma HTTP se valida aquí para que el motor siga siendo independiente
  // de Request/Response y de JSON.
  const amount = body.monto_mxn as number;
  const term = body.plazo_dias as number;
  validateAmount(amount);
  validateTerm(term);

  const common = {
    monto_mxn: amount,
    rfc_cliente: normalizeRfc(body.rfc_cliente),
    plazo_dias: term,
  };
  if (!invoice) return common;

  return {
    ...common,
    cliente: body.cliente as string,
    uuid_cfdi: body.uuid_cfdi as string,
  };
}

export function simulate(input: SimulationRequest, uuid = "00000000-0000-0000-0000-000000000000") {
  const compliance = validateCompliance({ ...input, uuid_cfdi: uuid }, {
    sat: sat as Sat69bRecord[], ofac, debtors: debtors as DebtorRecord[],
  });
  const debtor = (debtors as DebtorRecord[]).find(d => d.rfc === normalizeRfc(input.rfc_cliente)) ?? null;
  const scoring = calculateScoring({ ...input, pagador: debtor }, compliance);
  const offer = createFactoringOffer(input.monto_mxn, debtor?.calificacion ?? null, input.plazo_dias, scoring.decision);
  const response: SimulationResponse = {
    score: scoring.score, decision: scoring.decision,
    dias_promedio_pago: scoring.dias_promedio_pago ?? 0,
    monto_anticipo: offer?.monto_anticipo ?? 0, tasa_aplicada: offer?.tasa_aplicada ?? 0,
  };
  return { compliance, response };
}

export function inputError(request: Request, error: unknown): Response {
  if (error instanceof RequestError || error instanceof EngineInputError) {
    return apiJson<ApiError>(request, { error: {
      code: error instanceof EngineInputError ? error.code : "PETICION_INVALIDA", message: error.message,
    } }, 400);
  }
  return apiJson<ApiError>(request, { error: { code: "ERROR_INTERNO", message: "No se pudo procesar la simulación." } }, 500);
}

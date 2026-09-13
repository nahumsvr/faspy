import type { DebtorRating } from "../data/types.ts";
import type { ScoringDecision } from "../../types/schema.ts";
import { EngineInputError } from "./types.ts";
import type { FactoringConditions, FactoringResult } from "./types.ts";
import { validateAmount, validateTerm } from "./validation.ts";

export function selectFactoringConditions(rating: DebtorRating, term: number): FactoringConditions | null {
  validateTerm(term);
  const conditions = {
    A: { aforo: 0.9, rate: 0.01 },
    B: { aforo: 0.85, rate: 0.015 },
    C: { aforo: 0.8, rate: 0.02 },
  };
  if (rating === "D") return null;
  if (!Object.hasOwn(conditions, rating)) {
    throw new EngineInputError("PAGADOR_INVALIDO", "Rating inválido.");
  }
  return { aforo: conditions[rating].aforo, tasa_aplicada: conditions[rating].rate * (term / 30), comision_mxn: 0 };
}

export function calculateFactoring(amount: number, conditions: Readonly<FactoringConditions>): FactoringResult {
  validateAmount(amount);
  const { aforo, tasa_aplicada, comision_mxn } = conditions;
  if (!Number.isFinite(aforo) || aforo <= 0 || aforo > 1) {
    throw new EngineInputError("AFORO_INVALIDO", "El aforo debe estar en (0, 1].");
  }
  if (!Number.isFinite(tasa_aplicada) || tasa_aplicada < 0 || tasa_aplicada >= 1) {
    throw new EngineInputError("TASA_INVALIDA", "La tasa del periodo debe estar en [0, 1).");
  }
  const available = amount * aforo * (1 - tasa_aplicada);
  if (!Number.isFinite(comision_mxn) || comision_mxn < 0 || comision_mxn > available) {
    throw new EngineInputError("COMISION_INVALIDA", "La comisión debe estar entre cero y el disponible.");
  }
  const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);
  const advanceCents = cents(available - comision_mxn);
  const commissionCents = cents(comision_mxn);
  const discountCents = cents(amount * aforo * tasa_aplicada);
  // Cada concepto se redondea a centavos de forma independiente.
  return {
    aforo, tasa_aplicada, comision_mxn: commissionCents / 100,
    monto_anticipo: advanceCents / 100,
    descuento_mxn: discountCents / 100,
    reserva_mxn: cents(amount * (1 - aforo)) / 100,
  };
}

/** decision debe ser el resultado combinado de cumplimiento y scoring. */
export function createFactoringOffer(
  amount: number, rating: DebtorRating | null, term: number, decision: ScoringDecision,
): FactoringResult | null {
  validateAmount(amount);
  validateTerm(term);
  if (decision !== "aprobada" || rating === null) return null;
  const conditions = selectFactoringConditions(rating, term);
  return conditions ? calculateFactoring(amount, conditions) : null;
}

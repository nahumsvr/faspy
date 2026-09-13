import type { InvoiceTermDays } from "../data/types.ts";
import { EngineInputError } from "./types.ts";

export function validateAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0 || amount * 100 > Number.MAX_SAFE_INTEGER) {
    throw new EngineInputError("MONTO_INVALIDO", "El monto debe ser positivo, finito y representable en centavos seguros.");
  }
}

export function validateTerm(term: number): asserts term is InvoiceTermDays {
  if (term !== 30 && term !== 60 && term !== 90) {
    throw new EngineInputError("PLAZO_INVALIDO", "El plazo debe ser 30, 60 o 90 días.");
  }
}

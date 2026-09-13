import type { ScoringDecision } from "../../types/schema.ts";
import { EngineInputError } from "./types.ts";
import type { ComplianceResult, EngineReason, ScoringInput, ScoringResult } from "./types.ts";
import { validateAmount, validateTerm } from "./validation.ts";

/** Combina decisiones sin permitir que una aprobación sobreescriba un bloqueo. */
export function combineDecisions(a: ScoringDecision, b: ScoringDecision): ScoringDecision {
  if (a === "rechazada" || b === "rechazada") return "rechazada";
  return a === "revision" || b === "revision" ? "revision" : "aprobada";
}

export function calculateScoring(
  input: Readonly<ScoringInput>,
  compliance?: Readonly<Pick<ComplianceResult, "decision" | "motivos">>,
): ScoringResult {
  const { pagador, monto_mxn, plazo_dias } = input;
  validateAmount(monto_mxn);
  validateTerm(plazo_dias);
  const motivos: EngineReason[] = [...(compliance?.motivos ?? [])];
  if (!pagador) {
    return {
      puntuacion: null, score: "BAJO", dias_promedio_pago: null,
      decision: combineDecisions("revision", compliance?.decision ?? "aprobada"),
      motivos: [...new Set([...motivos, "PAGADOR_DESCONOCIDO" as const])],
    };
  }
  const bases = { A: 95, B: 80, C: 60, D: 35 };
  if (!Object.hasOwn(bases, pagador.calificacion)
    || !Number.isFinite(pagador.limite_exposicion_mxn) || pagador.limite_exposicion_mxn <= 0
    || !Number.isFinite(pagador.dias_promedio_pago) || pagador.dias_promedio_pago < 0) {
    throw new EngineInputError("PAGADOR_INVALIDO", "Rating, límite o días promedio inválidos.");
  }
  const ratio = monto_mxn / pagador.limite_exposicion_mxn;
  const exposurePenalty = ratio > 0.8 ? 20 : ratio > 0.5 ? 10 : 0;
  if (plazo_dias === 60) motivos.push("PLAZO_60");
  if (plazo_dias === 90) motivos.push("PLAZO_90");
  if (exposurePenalty === 10) motivos.push("EXPOSICION_MEDIA");
  if (exposurePenalty === 20) motivos.push("EXPOSICION_ALTA");
  if (ratio > 1) motivos.push("LIMITE_EXCEDIDO");
  const puntuacion = Math.max(0, Math.min(100, bases[pagador.calificacion] - (plazo_dias / 30 - 1) * 5 - exposurePenalty));
  const score = puntuacion >= 80 ? "ALTO" : puntuacion >= 50 ? "MEDIO" : "BAJO";
  const decision = ratio > 1 || score === "BAJO" ? "rechazada" : score === "MEDIO" ? "revision" : "aprobada";
  return {
    puntuacion, score, dias_promedio_pago: pagador.dias_promedio_pago,
    decision: combineDecisions(decision, compliance?.decision ?? "aprobada"),
    motivos: [...new Set(motivos)],
  };
}

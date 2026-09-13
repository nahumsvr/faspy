import { apiJson, apiOptions } from "../../../lib/api/response.ts";
import { depositFor } from "../../../lib/engine/scenario.ts";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiJson(request, { error: { code: "INVALID_JSON", message: "El body debe ser JSON válido." } }, 400);
  }
  const facturaId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).facturaId : undefined;
  if (typeof facturaId !== "string" || !facturaId) {
    return apiJson(request, { error: { code: "INVALID_REQUEST", message: "Se requiere facturaId como string." } }, 400);
  }
  const deposit = depositFor(facturaId);
  if (!deposit) {
    return apiJson(request, { error: { code: "SCENARIO_NOT_SUPPORTED", message: "Solo está habilitado el escenario sintético documentado." } }, 422);
  }
  return apiJson(request, deposit);
}

export const OPTIONS = apiOptions;

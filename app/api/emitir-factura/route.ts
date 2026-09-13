import { apiJson, apiOptions } from "../../../lib/api/response.ts";
import { offerFor } from "../../../lib/engine/factoring.ts";
import { validateCompliance } from "../../../lib/engine/compliance.ts";
import { scoreInvoice } from "../../../lib/engine/scoring.ts";
import type { EmitirFacturaRequest } from "../../../types/schema.ts";

const delay = () => new Promise<void>(resolve => setTimeout(resolve, 700));

function isInvoice(value: unknown): value is EmitirFacturaRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.monto_mxn === "number" && Number.isFinite(record.monto_mxn)
    && typeof record.cliente === "string"
    && typeof record.rfc_cliente === "string"
    && typeof record.plazo_dias === "number" && Number.isFinite(record.plazo_dias)
    && typeof record.uuid_cfdi === "string";
}

export async function POST(request: Request) {
  await delay();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiJson(request, { error: { code: "INVALID_JSON", message: "El body debe ser JSON válido." } }, 400);
  }
  if (!isInvoice(body)) {
    return apiJson(request, { error: { code: "INVALID_REQUEST", message: "La solicitud no coincide con EmitirFacturaRequest." } }, 400);
  }
  const compliance = validateCompliance(body);
  const score = scoreInvoice(body);
  const response = offerFor(body);
  if (!compliance || !score || !response) {
    return apiJson(request, { error: { code: "SCENARIO_NOT_SUPPORTED", message: "Solo está habilitado el escenario sintético documentado." } }, 422);
  }
  return apiJson(request, response, 200);
}

export const OPTIONS = apiOptions;

import { apiJson, apiOptions } from "@/lib/api/response";
import type { HealthResponse } from "@/types/schema";

export function GET(request: Request) {
  return apiJson<HealthResponse>(request, {
    status: "ok", service: "ecostream", mode: "simulation",
  });
}
export const OPTIONS = apiOptions;

import history from "../../../../lib/data/invoices-history.json" with { type: "json" };
import type { InvoiceHistoryRecord } from "../../../../lib/data/types.ts";
import { apiJson, apiOptions } from "../../../../lib/api/response.ts";

export function GET(request: Request) {
  return apiJson<InvoiceHistoryRecord[]>(request, history as InvoiceHistoryRecord[]);
}
export const OPTIONS = apiOptions;

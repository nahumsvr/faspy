import { apiJson, apiOptions } from "../../../../lib/api/response.ts";
import { inputError, readInput, simulate } from "../../../../lib/api/simulation.ts";

export async function POST(request: Request) {
  try {
    return apiJson(request, simulate(await readInput(request, false)).response);
  } catch (error) { return inputError(request, error); }
}
export const OPTIONS = apiOptions;

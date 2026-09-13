import { apiJson, apiOptions } from "../../../lib/api/response.ts";
import { inputError, readInput, simulate, VIRTUAL_CLABE } from "../../../lib/api/simulation.ts";
import type { EmitirFacturaResponse } from "../../../types/schema.ts";

export async function POST(request: Request) {
  try {
    const input = await readInput(request, true);
    await new Promise(r => setTimeout(r, 700));
    const { compliance, response } = simulate(input, input.uuid_cfdi);
    return apiJson<EmitirFacturaResponse>(request, {
      factura_id: `FAC-${input.uuid_cfdi.toLowerCase()}`,
      cfdi_status: compliance.cfdi_status,
      // El contrato binario expresa coincidencia SAT; decision conserva la revisión por desconocidos.
      efos_status: compliance.efos_status ?? "LIMPIO",
      ...response,
      // La CLABE es una referencia ficticia de la demo; no implica aprobación ni desembolso.
      clabe_virtual: VIRTUAL_CLABE,
    });
  } catch (error) { return inputError(request, error); }
}
export const OPTIONS = apiOptions;

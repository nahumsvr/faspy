/** Infraestructura inicial. Sin contrato de facturas hasta sincronizar con ERP. */
export interface HealthResponse {
  status: "ok";
  service: "ecostream";
  mode: "simulation";
}
export interface ApiError {
  error: { code: string; message: string };
}

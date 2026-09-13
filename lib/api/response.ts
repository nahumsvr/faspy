/** Usar en todos los handlers para permitir el origen configurado del ERP. */
export function corsHeaders(request: Request): Headers {
  const headers = new Headers({ Vary: "Origin" });
  const allowedOrigin = new URL(process.env.ERP_ORIGIN ?? "http://localhost:3001").origin;
  if (request.headers.get("Origin") === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return headers;
}
export function apiJson<T>(request: Request, body: T, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders(request) });
}
export function apiOptions(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

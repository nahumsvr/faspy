# Contrato de integración HTTP: ERP ⟷ Faspy Core

Fuente de verdad en este repositorio: [`types/schema.ts`](../../types/schema.ts).  
Espejo del contrato del ERP revisado en `921fd4e`: [`../erp-faspy/types/schema.ts`](file:///Users/nahumsvr/Documents/code-projects/erp-faspy/types/schema.ts).
Las rutas financieras implementadas solo habilitan el escenario sintético documentado
en este archivo; una entrada distinta responde `422 SCENARIO_NOT_SUPPORTED`.

---

## 1. Emisión de Factura y Validación (`POST /api/emitir-factura`)

### Request (`EmitirFacturaRequest` / `InvoiceCFDI`)
El ERP envía el objeto directamente en la raíz del body (plano, sin envoltorio `invoice` ni `data`):

```json
{
  "monto_mxn": 150000,
  "cliente": "Distribuidora Industrial S.A. de C.V.",
  "rfc_cliente": "DIN890214ABC",
  "plazo_dias": 60,
  "uuid_cfdi": "4a71d8be-b51f-46df-9a84-18ef5560965e"
}
```

### Response (`EmitirFacturaResponse`)
Respuesta plana que incluye el informe de cumplimiento fiscal y la oferta de factoraje:

```json
{
  "factura_id": "FAC-2026-001",
  "cfdi_status": "VIGENTE",
  "efos_status": "LIMPIO",
  "score": "ALTO",
  "monto_anticipo": 120000,
  "tasa_aplicada": 0.02,
  "dias_promedio_pago": 45,
  "clabe_virtual": "012180001234567890",
  "decision": "aprobada"
}
```

- `clabe_virtual`: Cadena literal (`string`) de 18 dígitos, nunca formateada como número para preservar ceros a la izquierda.
- `tasa_aplicada`: Fracción numérica (ej. `0.02` representa 2%).
- `decision`: Unión `"aprobada" | "revision" | "rechazada"`.

El único escenario ejecutable usa exactamente los valores del ejemplo anterior. No
se calculan importes para otras facturas ni se consulta SAT, EFOS, OFAC o SPEI real.

---

## 2. Aceptación de Anticipo (`POST /api/aceptar-anticipo`)

### Request (`AceptarAnticipoRequest`)
```json
{
  "facturaId": "FAC-2026-001"
}
```

### Response (`AnticipoConfirmado`)
```json
{
  "factura_id": "FAC-2026-001",
  "estado": "FONDEADA",
  "monto_depositado": 120000,
  "fecha_deposito": "2026-09-13T10:00:00Z"
}
```

---

## 3. Simulación de Liquidación / Cobro (`POST /api/simular-pago`)

### Request (`SimularPagoRequest`)
```json
{
  "facturaId": "FAC-2026-001"
}
```

### Response (`ResultadoPago`)
```json
{
  "factura_id": "FAC-2026-001",
  "principal_retenido": 120000,
  "comision_cobrada": 3000,
  "remanente_dispersado": 27000,
  "margen_neto_pct": 0.02
}
```

## Política de errores de la simulación

Los handlers responden `400` con `{ "error": { "code", "message" } }` cuando
el JSON o los campos requeridos son inválidos. Responden `422` con
`SCENARIO_NOT_SUPPORTED` cuando la solicitud es válida pero no coincide con el
escenario acordado. Esta política es propia de la simulación y no añade reglas
financieras al contrato de datos.

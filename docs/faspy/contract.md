# Contrato de integración HTTP: ERP ⟷ Faspy Core

Fuente de verdad en este repositorio: [`types/schema.ts`](../../types/schema.ts).  
Espejo del contrato del ERP revisado en `921fd4e`: [`../erp-faspy/types/schema.ts`](file:///Users/nahumsvr/Documents/code-projects/erp-faspy/types/schema.ts).
Aceptación y pago solo habilitan el ID del escenario sintético documentado;
un ID distinto responde `422 SCENARIO_NOT_SUPPORTED`. Emisión y scoring
conservan el motor general de aprobación, revisión y rechazo.

## Requests en Bruno

La colección versionada está en [`workspace.yml`](./workspace.yml). Cada request
incluye la petición completa, headers, status esperado, assertions y un ejemplo de
respuesta en su bloque `docs`:

| Ruta | Request Bruno | Estado |
| --- | --- | --- |
| `GET /api/health` | [`health.yml`](./collections/api/health.yml) | Implementada y ejecutable |
| `OPTIONS /api/health` | [`health-options.yml`](./collections/api/health-options.yml) | Implementada y ejecutable |
| `POST /api/emitir-factura` | [`emitir-factura.yml`](./collections/api/emitir-factura.yml) | Implementada y ejecutable |
| `OPTIONS /api/emitir-factura` | [`emitir-factura-options.yml`](./collections/api/emitir-factura-options.yml) | Implementada y ejecutable |
| `POST /api/aceptar-anticipo` | [`aceptar-anticipo.yml`](./collections/api/aceptar-anticipo.yml) | Implementada para el escenario documentado |
| `POST /api/simular-pago` | [`simular-pago.yml`](./collections/api/simular-pago.yml) | Implementada para el escenario documentado |
| `GET /api/compliance/audit` | [`compliance-audit.yml`](./collections/api/compliance-audit.yml) | Implementada y ejecutable |
| `OPTIONS /api/compliance/audit` | [`compliance-audit-options.yml`](./collections/api/compliance-audit-options.yml) | Implementada y ejecutable |
| `POST /api/scoring/simulate` | [`scoring-simulate.yml`](./collections/api/scoring-simulate.yml) | Implementada y ejecutable |
| `OPTIONS /api/scoring/simulate` | [`scoring-simulate-options.yml`](./collections/api/scoring-simulate-options.yml) | Implementada y ejecutable |

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
  "factura_id": "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e",
  "cfdi_status": "VIGENTE",
  "efos_status": "LIMPIO",
  "score": "ALTO",
  "monto_anticipo": 132300,
  "tasa_aplicada": 0.02,
  "dias_promedio_pago": 32,
  "clabe_virtual": "012180001234567890",
  "decision": "aprobada"
}
```

- `clabe_virtual`: Cadena literal (`string`) de 18 dígitos, nunca formateada como número para preservar ceros a la izquierda.
- `tasa_aplicada`: Fracción numérica (ej. `0.02` representa 2%).
- `decision`: Unión `"aprobada" | "revision" | "rechazada"`.
- `factura_id`: Identificador determinista `FAC-` seguido del UUID recibido en minúsculas.
- La CLABE es ficticia y se devuelve como string aun sin oferta; su presencia no implica aprobación ni desembolso.
- Cuando no hay oferta, `monto_anticipo` y `tasa_aplicada` valen `0`. Para un pagador desconocido,
  `dias_promedio_pago` vale `0` y `efos_status` se adapta a `LIMPIO`, mientras `decision` conserva `revision`.

La ruta espera el body plano `EmitirFacturaRequest`, valida JSON, campos, tipos, monto y plazo,
ejecuta el motor determinista y simula 700 ms de validación. Un RFC o UUID no vacío con sintaxis
inválida no es un error HTTP: el motor lo devuelve como rechazo con status 200. JSON inválido,
campos ausentes, tipos incorrectos, monto inválido y plazos distintos de 30/60/90 devuelven
`ApiError` con status 400.

El único escenario ejecutable usa exactamente los valores del ejemplo anterior. No
se calculan importes para otras facturas ni se consulta SAT, EFOS, OFAC o SPEI real.

---

## 2. Auditoría de cumplimiento (`GET /api/compliance/audit`)

No requiere body. Devuelve los 18 registros históricos precargados sin recalcularlos ni agregar
emisiones nuevas. Cada registro conserva los campos compartidos y los campos adicionales de
auditoría `plazo_dias`, `ofac_status` y `motivo_decision`.

## 3. Simulación de scoring (`POST /api/scoring/simulate`)

Recibe `rfc_cliente`, `monto_mxn` y `plazo_dias` (30, 60 o 90), y devuelve la misma composición
de scoring y oferta que la emisión, sin validar un CFDI, sin latencia y sin registrar facturas.
También aplica los bloqueos sintéticos EFOS, EDOS y OFAC.

### Request

```json
{
  "rfc_cliente": "DIN890214ABC",
  "monto_mxn": 150000,
  "plazo_dias": 60
}
```

### Response esperada · 200 OK

```json
{
  "score": "ALTO",
  "decision": "aprobada",
  "dias_promedio_pago": 32,
  "monto_anticipo": 132300,
  "tasa_aplicada": 0.02
}
```

Los casos en revisión o rechazo no reciben oferta: `monto_anticipo` y `tasa_aplicada` son `0`.

## 4. Aceptación de Anticipo (`POST /api/aceptar-anticipo`)

### Request (`AceptarAnticipoRequest`)
```json
{
  "facturaId": "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e"
}
```

### Response (`AnticipoConfirmado`)
```json
{
  "factura_id": "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e",
  "estado": "FONDEADA",
  "monto_depositado": 132300,
  "fecha_deposito": "2026-09-13T10:00:00.000Z"
}
```

---

## 5. Simulación de Liquidación / Cobro (`POST /api/simular-pago`)

Liquidación fija del escenario de `lib/data/scenario.json`, alineada al anticipo de
132300 MXN del motor. Conserva comisión de 3000 MXN y dispersa 14700 MXN.
`margen_neto_pct` es fracción: 0.02 equivale a 2%. No generaliza una fórmula
para otras facturas. No hay persistencia, control de secuencia ni transferencias.

### Request (`SimularPagoRequest`)
```json
{
  "facturaId": "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e"
}
```

### Response (`ResultadoPago`)
```json
{
  "factura_id": "FAC-4a71d8be-b51f-46df-9a84-18ef5560965e",
  "principal_retenido": 132300,
  "comision_cobrada": 3000,
  "remanente_dispersado": 14700,
  "margen_neto_pct": 0.02
}
```

## Política de errores de la simulación

Los handlers responden `400` con `{ "error": { "code", "message" } }` cuando
el JSON o los campos requeridos son inválidos. Responden `422` con
`SCENARIO_NOT_SUPPORTED` en aceptación y pago cuando el ID no coincide con el
escenario acordado. Esta política es propia de la simulación y no añade reglas
financieras al contrato de datos.

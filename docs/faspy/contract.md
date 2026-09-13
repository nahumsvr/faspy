# Contrato de integración HTTP: ERP ⟷ Faspy Core

Fuente de verdad en este repositorio: [`types/schema.ts`](../../types/schema.ts).  
Espejo exacto del contrato del ERP: [`../erp-faspy/types/schema.ts`](file:///Users/nahumsvr/Documents/code-projects/erp-faspy/types/schema.ts).

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
| `POST /api/aceptar-anticipo` | [`aceptar-anticipo.yml`](./collections/api/aceptar-anticipo.yml) | Contrato documentado; endpoint pendiente |
| `POST /api/simular-pago` | [`simular-pago.yml`](./collections/api/simular-pago.yml) | Contrato documentado; endpoint pendiente |
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
  "facturaId": "FAC-2026-001"
}
```

### Response (`AnticipoConfirmado`)
```json
{
  "factura_id": "FAC-2026-001",
  "estado": "FONDEADA",
  "monto_depositado": 132300,
  "fecha_deposito": "2026-09-13T10:00:00Z"
}
```

---

## 5. Simulación de Liquidación / Cobro (`POST /api/simular-pago`)

Ejemplo legado independiente, no encadenable con la nueva oferta de emisión.
La política de liquidación y la discrepancia entre porcentaje/fracción de
`margen_neto_pct` quedan pendientes de coordinación con el ERP en esa tarea.
No representa los resultados del motor 1.3.

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

# Datos precargados · P1

Los cuatro archivos de este directorio son fixtures sintéticos y deterministas para
la demo de Capital One EcoStream. Todas las empresas, RFC, sanciones, importes y
decisiones son ficticios; no representan personas o entidades reales ni consultan
SAT, OFAC, SPEI o ningún servicio externo. Los resultados de `invoices-history.json`
son ejemplos precalculados: esta tarea no define umbrales ni algoritmos de scoring.

Los tipos internos están en [`types.ts`](./types.ts). El historial extiende
`ComplianceAuditItem` desde [`types/schema.ts`](../../types/schema.ts), que permanece
sin cambios para conservar el espejo del contrato del ERP.

## Archivos y campos

### `sat-69b.json`

Arreglo de ocho registros del catálogo fiscal sintético. Tiene seis RFC `LIMPIO`,
uno `EFOS` y uno `EDOS`.

| Campo | Significado |
| --- | --- |
| `rfc` | RFC ficticio y clave de referencia del pagador. |
| `razon_social` | Nombre legal sintético asociado al RFC. |
| `clasificacion` | `LIMPIO`, `EFOS` o `EDOS`. EFOS y EDOS son etiquetas simplificadas para la demo, no una determinación fiscal real. |
| `motivo` | Evidencia textual precargada de la clasificación. |

### `ofac-sanctions.json`

Arreglo de tres entidades sancionadas en una lista OFAC sintética. Sus campos son
`id` (identificador único), `nombre` (nombre de la entidad), `rfc` (referencia al
catálogo sintético) y `motivo` (explicación de la coincidencia). Las tres entidades
coinciden con pagadores `LIMPIO` en SAT; esto permite demostrar que la alerta OFAC
es independiente de la fiscal.

### `debtors.json`

Arreglo de los mismos ocho pagadores del catálogo SAT, con dos pagadores por cada
calificación `A`, `B`, `C` y `D`.

| Campo | Significado |
| --- | --- |
| `rfc` | Clave que relaciona el pagador con SAT, OFAC e historial. |
| `razon_social` | Nombre del pagador; debe coincidir exactamente con SAT. |
| `calificacion` | Calificación sintética `A`–`D`. |
| `dias_promedio_pago` | Días promedio de pago precargados. |
| `facturas_pagadas` | Conteo entero de facturas pagadas. |
| `facturas_vencidas` | Conteo entero de facturas vencidas. |
| `limite_exposicion_mxn` | Límite de exposición ficticio en MXN. |

### `invoices-history.json`

Arreglo de 18 registros compatibles con `ComplianceAuditItem`. Mantiene los campos
del contrato y añade `plazo_dias`, `ofac_status` y `motivo_decision`.

| Campo | Origen | Significado |
| --- | --- | --- |
| `id` | Contrato | Identificador único de la factura en la auditoría. |
| `uuid_cfdi` | Contrato | UUID v4 único del CFDI sintético. |
| `rfc_cliente` | Contrato | RFC del pagador; referencia a `sat-69b.json` y `debtors.json`. |
| `cliente` | Contrato | Razón social del pagador, conservada exactamente entre archivos. |
| `monto_mxn` | Contrato | Importe positivo de la factura en MXN. |
| `cfdi_status` | Contrato | Estado precalculado del CFDI: `VIGENTE` o `RECHAZADO`. |
| `efos_status` | Contrato | Estado fiscal derivado exclusivamente de la clasificación SAT: `LIMPIO` o `SANCIONADO`. |
| `score` | Contrato | Resultado de riesgo precalculado: `ALTO`, `MEDIO` o `BAJO`. |
| `decision` | Contrato | Decisión precalculada: `aprobada`, `revision` o `rechazada`. |
| `timestamp` | Contrato | Fecha y hora fija del evento, en ISO 8601 UTC. |
| `plazo_dias` | Fixture | Plazo fijo de la factura: `30`, `60` o `90`. |
| `ofac_status` | Fixture | Estado OFAC independiente: `LIMPIO` o `SANCIONADO`, derivado de `ofac-sanctions.json`. |
| `motivo_decision` | Fixture | Explicación textual de la decisión precalculada. |

`id` identifica de forma única cada factura y `uuid_cfdi` es un UUID v4 válido y
único. `monto_mxn` es positivo. `timestamp` usa timestamps ISO 8601 en UTC (`Z`)
fijos, por lo que leer los fixtures no depende del reloj ni de números aleatorios.
`cliente` y `rfc_cliente` coinciden exactamente con el pagador correspondiente en
`debtors.json`.

## Relaciones y estados

- El RFC es la llave de relación entre los cuatro archivos. Los nombres se conservan
  idénticos en `razon_social`, `nombre` y `cliente` cuando una entidad aparece en
  varios archivos.
- `efos_status` solo refleja el catálogo SAT: es `LIMPIO` si `clasificacion` es
  `LIMPIO`, y `SANCIONADO` si es `EFOS` o `EDOS`. Una coincidencia OFAC nunca cambia
  este campo.
- `ofac_status` solo refleja la lista OFAC sintética. Por eso un pagador puede ser
  fiscalmente `LIMPIO` y a la vez `SANCIONADO` en OFAC.
- `cfdi_status`, `score`, `decision` y `motivo_decision` son el resultado histórico
  ya precalculado de cada escenario. No deben interpretarse como reglas nuevas del
  motor.

La distribución del historial es:

| Decisión | Cantidad | Escenarios destacados |
| --- | ---: | --- |
| `aprobada` | 9 | Facturas vigentes de pagadores fiscales limpios y sin sanción OFAC. `DIN890214ABC` aparece aquí como caso limpio y aprobado del ejemplo de integración. |
| `revision` | 4 | Dos revisiones de pagadores fiscalmente limpios por monto/plazo y dos coincidencias OFAC pendientes de revisión. |
| `rechazada` | 5 | Un rechazo por cada motivo requerido: EFOS, EDOS, OFAC, CFDI rechazado y riesgo crediticio. |

La validación automatizada de estos invariantes vive en
[`tests/data.test.mts`](../../tests/data.test.mts) y se ejecuta con `pnpm test`.

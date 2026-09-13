# Motor de simulación · P1 · Tarea 1.3

Funciones puras: reciben datos por parámetros, no mutan entradas y no usan fetch,
reloj, aleatoriedad ni estado global. Los fixtures son inyectados por el consumidor.
El historial precalculado no se recalcula ni se usa como algoritmo.

## Interfaces

- `validateCompliance(invoice, { sat, ofac, debtors })`: normaliza RFC con trim y
  mayúsculas; verifica RFC de 12/13 caracteres y UUID hexadecimal 8-4-4-4-12
  (sin restringir versión). Son validaciones sintácticas, no de existencia fiscal.
  `cfdi_status` depende solo de la sintaxis del UUID. EFOS/EDOS, OFAC exacto o
  sintaxis inválida rechazan. SAT o pagador desconocido provoca revisión, salvo
  rechazo. SAT y OFAC son independientes; SAT desconocido devuelve estado nulo.
- `isValidClabe(value)`: exige string de 18 dígitos; no verifica checksum ni cuenta.
  CLABE no es un campo requerido del request de emisión.
- `calculateScoring({ pagador, monto_mxn, plazo_dias }, compliance?)`: devuelve
  puntuación, score, decisión, días promedio y códigos de motivos. Sin compliance
  calcula solo riesgo crediticio (útil para el simulador). Para emitir una oferta,
  pasar siempre cumplimiento. `combineDecisions` aplica rechazo > revisión > aprobación.
- `selectFactoringConditions(rating, term)`: selecciona condiciones; D devuelve null.
- `calculateFactoring(amount, conditions)`: calcula importes, sin decidir elegibilidad.
- `createFactoringOffer(amount, rating, term, decision)`: usar la decisión combinada;
  solo aprobada con rating A–C produce oferta. En otros casos devuelve null.

Los tipos y `EngineInputError` son internos. Los errores numéricos arrojan esta
excepción con `code` estable; incidencias de cumplimiento son resultados de negocio.
Monto positivo y finito con centavos dentro de `Number.MAX_SAFE_INTEGER`; plazo
30/60/90. Pagador desconocido: puntuación y días nulos, BAJO y revisión (o rechazo
por cumplimiento). No convertir estos nulos a datos ficticios en una futura API.

## Política de demo

Bases: A=95, B=80, C=60, D=35. Penalización por plazo 30/60/90: 0/5/10.
Exposición = monto de esta factura / límite del pagador: hasta 50% resta 0;
mayor a 50% y hasta 80% resta 10; mayor a 80% resta 20. Más de 100% rechaza.
No se calcula exposición acumulada. Puntuación limitada a 0–100:
ALTO ≥80 aprueba, MEDIO ≥50 revisa, BAJO <50 rechaza, sujetos a cumplimiento.
Los días de pago se copian del pagador; conteos históricos no agregan penalizaciones.

| Rating | Aforo | Tasa por 30 días | Comisión MXN |
| --- | ---: | ---: | ---: |
| A | 0.90 | 0.01 | 0 |
| B | 0.85 | 0.015 | 0 |
| C | 0.80 | 0.02 | 0 |
| D | Sin oferta | — | — |

Tasa del periodo = tasa base × plazo / 30 (fracción, no tasa anual).
Anticipo = monto × aforo × (1 − tasa) − comisión.
Descuento = monto × aforo × tasa. Reserva = monto × (1 − aforo).
Aforo en (0,1], tasa en [0,1), comisión finita entre 0 y el disponible previo a
comisión. Cada importe se redondea a centavos independientemente; pueden existir
residuos de un centavo al sumar conceptos. No es un libro contable de liquidación.

Referencia DIN890214ABC, $150,000, 60 días: 90 puntos, ALTO, aprobada,
32 días promedio, tasa 0.02, anticipo $132,300, descuento $2,700, reserva $15,000.

## Verificación e integración

`pnpm test` cubre reglas y composición en `tests/engine.test.mts`; `pnpm check`
añade lint, tipos y build. La capa API integra los endpoints, generación de
ID/CLABE, serialización de resultados desconocidos y latencia de 700 ms; sus
handlers y escenarios HTTP se cubren en `tests/api.test.mts` y `scripts/smoke.mjs`.
No se agregan campos a `types/schema.ts`. Bruno documenta emisión, auditoría,
scoring, errores y preflight. El ejemplo de liquidación queda explícitamente
legado e independiente hasta definir ese flujo con el ERP (incluida la unidad
de `margen_neto_pct`).

## Integración para main · septiembre 2026

Se conserva el motor general de develop y sus fixtures originales, incluyendo aprobación, revisión y rechazo. Se incorporan aceptación y pago de la rama financiera, limitados a `lib/data/scenario.json`. Por decisión explícita del usuario, prevalece el anticipo de 132300 MXN, días promedio 32 e ID FAC seguido del UUID; liquidación con principal 132300, comisión 3000 y remanente 14700. La comisión se conserva del escenario financiero; no se generaliza una fórmula ni se modifica el motor de scoring. Se añade scenario.json sin alterar la estructura de los otros fixtures.

El dashboard existe, pero sus métricas no consumen las operaciones emitidas. La demo básica del ERP usa Express y lib/api.ts. `/emision` puede encadenar los tres endpoints para el caso documentado. No hay persistencia, secuencia, idempotencia ni transferencias reales. README actualizado con arranque Windows/macOS, conexión ERP, rutas, demo y verificación. Esta sección sustituye los estados históricos de endpoints pendientes.

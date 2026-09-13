# EcoStream · Faspy: Diagnóstico de Estado y Checklist para el MVP

> **Entorno:** Hackathon Capital One EcoStream  
> **Alcance de este repositorio:** Backend / Motor de Simulación (`app/api`, `lib/engine`) y Dashboard (`app/dashboard`).  
> **Filosofía central:** Simulación determinista sin backend real, sin base de datos real y sin conexión a SAT/SPEI/OFAC.

---

## 1. Diagnóstico del Estado Actual ("Qué tenemos ahorita")

Se realizó un recorrido completo del código, build y pruebas (`pnpm check` pasó al 100% en verde). El repositorio mantiene la base arquitectónica limpia y ya tiene el frente P1 de API 1.4 integrado:

```
faspy/
├── app/
│   ├── api/
│   │   ├── health/route.ts          ✅ OK (Healthcheck + CORS validado)
│   │   ├── emitir-factura/route.ts  ✅ Emisión + cumplimiento + oferta + 700 ms
│   │   ├── compliance/audit/route.ts ✅ Auditoría histórica de 18 registros
│   │   └── scoring/simulate/route.ts ✅ Scoring/oferta sin CFDI ni latencia
│   ├── dashboard/
│   │   ├── layout.tsx               🟡 Shell básico (sin estética táctil/clay completa)
│   │   ├── page.tsx                 🟡 Placeholder ("En preparación")
│   │   ├── cumplimiento/page.tsx    🟡 Placeholder ("En preparación")
│   │   ├── decision/page.tsx        🟡 Placeholder ("En preparación")
│   │   └── mercado/page.tsx         🟡 Placeholder ("En preparación")
├── lib/
│   ├── api/response.ts              ✅ OK (CORS para ERP_ORIGIN, apiJson, apiOptions)
│   ├── data/                        ✅ Fixtures sintéticos deterministas (SAT, OFAC, deudores e historial)
│   └── engine/                      ✅ Cumplimiento, scoring y factoraje puros con pruebas
├── types/
│   └── schema.ts                    ✅ Contrato compartido sincronizado con ERP
├── components/
│   ├── dashboard/
│   │   └── module-placeholder.tsx   🟡 Placeholder básico
│   └── ui/
│       └── panel.tsx                🟡 Wrapper preliminar de `.clay-panel`
├── styles/
│   └── tokens.css                   ✅ Tokens de color y sombras según DESIGN.md
└── tests/ & scripts/
    ├── api.test.mts                 ✅ Pruebas de CORS, handlers y respuestas JSON
    └── smoke.mjs                    ✅ Smoke tests HTTP de API y dashboard
```

### Resumen del avance actual vs MVP:
| Capa | Estado Actual | Meta MVP | Brecha (% pendiente) |
|---|---|---|:---:|
| **Infraestructura & CI** | Next.js 16, TypeScript, Tailwind 4, scripts de validación, CORS. | Completada. | **0%** |
| **Contrato de Datos (`types/schema.ts`)** | Sincronizado al 100% con `erp-faspy` (CFDI, Factoraje, Compliance, Scoring, Anticipo y Liquidación). | Contrato CFDI, Factoraje, Compliance, Scoring y Métricas. | **0%** |
| **Fixtures Sintéticos (`lib/data/`)** | Cuatro JSON sintéticos deterministas, tipos internos, documentación y pruebas de invariantes. | Listas SAT 69-B, OFAC, catálogo deudores, facturas sintéticas. | **0%** |
| **Motor de Simulación (`lib/engine/`)** | Cumplimiento, scoring y factoraje deterministas probados. | Funciones puras: validación fiscal, scoring crediticio, aforo/descuento. | **0%** |
| **Endpoints API (`app/api/`)** | Healthcheck, emisión, auditoría y simulación implementados con CORS y errores tipados. | `/api/emitir-factura` (+700ms), `/api/compliance/audit`, `/api/scoring/simulate`. | **0%** |
| **Dashboard UI (`app/dashboard/`)** | 4 pantallas con placeholders. | Centro de Operaciones, Cumplimiento, Matriz de Decisión y TAM/SAM con componentes Claymorphic e interactividad. | **85%** |

---

## 2. El Cuello de Botella Crítico (Hito #1: RESUELTO ✅)

> [!NOTE]
> **Sincronización del Contrato `types/schema.ts` Completada**:
> El archivo `types/schema.ts` ha quedado sincronizado como espejo exacto con `erp-faspy`.
> Se modelaron los contratos para:
> 1. Factura / CFDI emitido (`InvoiceCFDI` plano: `monto_mxn`, `cliente`, `rfc_cliente`, `plazo_dias`, `uuid_cfdi`).
> 2. Resultado de Validación de Cumplimiento (`ComplianceReport`: `cfdi_status`, `efos_status`).
> 3. Oferta de Factoraje & Scoring (`EmitirFacturaResponse`: `score`, `monto_anticipo`, `tasa_aplicada`, `dias_promedio_pago`, `clabe_virtual`, `decision`).
> 4. Flujo de anticipo y liquidación (`AceptarAnticipoRequest`, `AnticipoConfirmado`, `SimularPagoRequest`, `ResultadoPago`).

---

## 3. Checklist y Tareas por Rol

### 🟦 Frente P1: Motor de Simulación, Datos y API
*Responsable de la lógica pura, datos sintéticos y endpoints HTTP.*

- [x] **Tarea 1.1: Definición de Esquemas (`types/schema.ts`)**
  - [x] Modelar `InvoiceCFDI`, `ComplianceReport`, `ScoringDecision`, `EmitirFacturaRequest` y `EmitirFacturaResponse`.
  - [x] Sincronizar contrato con `erp-faspy/types/schema.ts` (espejo exacto, plano, serialización de CLABE y validado con tests).
  - [x] Añadir casos de compilación y pruebas en `tests/schema.test.mts`.
  - [x] Actualizar documentación de contrato y colección Bruno (`docs/faspy/contract.md`).
- [x] **Tarea 1.2: Fixtures Sintéticos Deterministas (`lib/data/*.json`)**
  - [x] `sat-69b.json`: Ocho RFCs simulados con seis registros limpios, uno EFOS y uno EDOS.
  - [x] `ofac-sanctions.json`: Tres entidades ficticias sancionadas con alertas independientes del SAT.
  - [x] `debtors.json`: Ocho pagadores, dos por cada calificación A–D, con historial y límite de exposición.
  - [x] `invoices-history.json`: Dieciocho facturas con 9 aprobadas, 4 en revisión y 5 rechazadas.
- [x] **Tarea 1.3: Motor Puro de Simulación (`lib/engine/*.ts`)**
  - [x] `compliance.ts`: Validación de RFC contra 69-B y OFAC; validación sintáctica de CFDI y CLABE SPEI.
  - [x] `scoring.ts`: Algoritmo determinista de scoring en base al pagador, monto y plazo (30/60/90 días).
  - [x] `factoring.ts`: Cálculo financiero del factoraje:
    $$\text{Desembolso} = \text{Monto Factura} \times \text{Aforo} \times (1 - \text{Tasa Descuento}) - \text{Comisión}$$
- Reglas 1.3: [documentación del motor](../lib/engine/README.md). OFAC exacto rechaza; desconocidos pasan a revisión; sin oferta para casos no aprobados. Historial precargado intacto.
- Coordinación 1.4: resultados internos nulos adaptados en la API (`0` en días/oferta), `efos_status` desconocido compatible como `LIMPIO` con decisión `revision`; liquidación/unidad de margen siguen fuera de este alcance.

- [x] **Tarea 1.4: Endpoints de la API (`app/api/*`)**
  - [x] `POST /api/emitir-factura`:
    - Simular latencia obligatoria: `await new Promise(r => setTimeout(r, 700))`.
    - Ejecutar motor de cumplimiento y scoring.
    - Responder HTTP 200 con `EmitirFacturaResponse`, ID determinista y CLABE textual.
  - [x] `GET /api/compliance/audit`: Listado inmutable de 18 registros históricos con campos adicionales.
  - [x] `POST /api/scoring/simulate`: Recálculo dinámico para 30/60/90 días, con bloqueos SAT/OFAC y oferta solo aprobada.
- [x] **Tarea 1.5: Pruebas y Colección Bruno**
  - [x] Añadir peticiones ejecutables en `docs/faspy/collections/api/` con headers, assertions y respuestas de aprobación, rechazo, errores y preflight.
  - [x] Agregar tests unitarios en `tests/engine.test.mts` y pruebas de handlers en `tests/api.test.mts`.
  - [x] Extender `scripts/smoke.mjs` con emisión, auditoría, scoring, CORS, preflight, errores y casos sin oferta.
  - [x] Ejecutar `pnpm check`, `pnpm test:smoke` y curls contra el servidor activo.

---

### 🟩 Frente P3: Dashboard, Visualización y Experiencia (UI)
*Responsable de la interfaz táctil Claymorphic, tableros y analítica.*

- [ ] **Tarea 3.1: Primitivas del Sistema Visual (`components/ui/*`)**  
  *(Alinear al 100% con [DESIGN.md](../DESIGN.md))*
  - [x] `PillButton` / `Button`: Botones primarios (Sovereign Blue `#004977`) y secundarios (Mint `#10B981`) con sombras táctiles y respuesta elástica `scale(0.97)`.
  - [x] `MetricCard`: Tarjetas de estadísticas con elevación Tier 1, direct specular highlight y números en `JetBrains Mono`.
  - [x] `BadgeStatus`: Chips para semáforo de cumplimiento (Verde: Validado, Rojo: 69-B / Alerta, Amarillo: Revisión).
  - [x] `TactileSlider`: Slider de velocidad de factoraje (aforo/días) con riel sunken y thumb pill extruded.
  - [x] `SegmentedControl`: Selector flotante estilo Apple Fluid para cambiar plazos o filtros.
- [x] **Tarea 3.2: Módulo Centro de Cumplimiento (`app/dashboard/cumplimiento/`)**
  - [x] KPI Ribbon: Tasa de aprobación fiscal, alertas 69-B detectadas, verificación OFAC y tiempo medio de resolución.
  - [x] Data Rows táctiles: Listado de facturas procesadas con chips de estado SAT/OFAC/SPEI.
  - [x] Detalle expandible/modal: Vista detallada de evidencia de validación (por qué se rechazó o aprobó un RFC).
- [x] **Tarea 3.3: Módulo Matriz de Decisión & Underwriting (`app/dashboard/decision/`)**
  - [x] Simulador Interactivo de Factoraje: Control interactivo para mover monto, plazo o aforo y ver el impacto instantáneo en liquidez vs costo financiero.
  - [x] Scorecard de Deudor: Gráfico o tabla de ratings (A, B, C, D) con límites de exposición y tasas asignadas.
  - [x] Visualización del flujo de fondos (Diagrama o steps: Factura emitida ➔ Validación ➔ Desembolso inmediato en T+0).
- [x] **Tarea 3.4: Módulo TAM / SAM / SOM (`app/dashboard/mercado/`)**
  - [x] Desglose visual del mercado de factoraje en México (TAM: Valor de facturación B2B; SAM: Factoraje accesible a PyMEs; SOM: Objetivo EcoStream).
  - [x] Calculadora de impacto económico: Ganancia de días de caja (DSO reducido de 75 a 1 día) y retorno para la empresa.
- [ ] **Tarea 3.5: Centro de Operaciones / Resumen General (`app/dashboard/page.tsx`)**
  - [ ] Vista ejecutiva unificada: Widgets que conectan Cumplimiento, Decisión de Liquidez y Métricas clave.
  - [ ] Feed en vivo simulado de transacciones recientes.
- [ ] **Tarea 3.6: Layout y Navegación Flotante (`app/dashboard/layout.tsx`)**
  - [ ] Mejorar la barra de navegación `glass-bar` para mostrar rutas activas, estado del simulador ("Modo: Simulación Activa") y acceso rápido a los 3 submódulos.

---

## 4. Hoja de Ruta de Ejecución Recomendada (Roadmap)

```mermaid
flowchart TD
    A["Hito 1: Contrato de Datos (types/schema.ts)"] --> B1["P1: Fixtures JSON (lib/data/)"]
    A --> B2["P3: Primitivas UI Claymorphism (components/ui/)"]
    B1 --> C1["P1: Motor de Reglas Puras (lib/engine/)"]
    B2 --> C2["P3: Mock Vistas con Fixtures (app/dashboard/*)"]
    C1 --> D1["P1: Endpoints API + 700ms Delay (app/api/)"]
    C2 --> E["Hito 4: Integración End-to-End"]
    D1 --> E
    E --> F["Hito 5: Smoke Tests, Bruno y Demo Polishing"]
```

### Paso 1: Bloqueador Inicial (Inmediato)
- P1 y el encargado del ERP aprueban los tipos en [`types/schema.ts`](../types/schema.ts).
- P1: ✅ Dejó los archivos JSON sintéticos en [`lib/data/`](../lib/data) para que ambos (backend y frontend) tengan datos deterministas de trabajo.

### Paso 2: Desarrollo Paralelo
- **P1**: ✅ Motor 1.3 y endpoints 1.4 implementados con pruebas unitarias, smoke HTTP y colección Bruno ejecutable.
- **P3**: Construye las primitivas visuales y las 3 pantallas en `app/dashboard/` consumiendo directamente los JSON de `lib/data/` (así el dashboard luce espectacular sin depender de que la API esté lista).

### Paso 3: Endpoints API y Conexión
- **P1**: ✅ Rutas de emisión, auditoría y scoring consumen el motor; emisión agrega la latencia de 700 ms simulada y las tres rutas exponen CORS/preflight.
- **P1**: ✅ Requests principales y escenarios de Bruno actualizados en `docs/faspy/collections/api/`.

### Paso 4: Demo Final y Validación
- ✅ Ejecutar `pnpm check` y `pnpm test:smoke`; verificar además emisión, auditoría, scoring, CORS, preflight y errores mediante curls contra el servidor activo.
- Conectar una prueba de emisión desde el ERP al simulador y observar cómo se refleja el estado de cumplimiento y la oferta de factoraje en el dashboard.

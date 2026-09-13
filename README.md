# Faspy — Motor de simulación y dashboard

Repositorio principal del proyecto: evalúa facturas, valida cumplimiento con datos sintéticos y calcula ofertas de factoraje. El ERP es un proyecto separado que captura la factura y presenta la respuesta de este motor.

No hay autenticación, base de datos ni conexiones reales a SAT, SPEI u OFAC. Las validaciones y operaciones financieras son simuladas.

## Requisitos

- Node.js 24 (ver `.nvmrc`).
- pnpm 11.2.2, declarado en `package.json`.
- Instalar las dependencias en cada equipo; no copiar `node_modules` entre Windows y macOS.

Comprueba `node --version` y `pnpm --version`. Si falta pnpm, instala la versión con `npm install --global pnpm@11.2.2`.

## Descargar el proyecto

```sh
git clone --branch main https://github.com/nahumsvr/faspy.git
cd faspy
```

Si ya tienes el repositorio, conserva tus cambios antes de actualizar. Con el árbol limpio:

```sh
git fetch origin
git switch main
git pull --ff-only origin main
```

## Arranque en macOS / Linux

```sh
pnpm install --frozen-lockfile
if [ ! -e .env.local ]; then cp .env.example .env.local; fi
pnpm dev
```

## Arranque en Windows — PowerShell

```powershell
pnpm install --frozen-lockfile
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
pnpm dev
```

Abre el [dashboard](http://localhost:3000/dashboard). El [healthcheck](http://localhost:3000/api/health) debe devolver:

```json
{"status":"ok","service":"faspy","mode":"simulation"}
```

El healthcheck comprueba Faspy, no la conexión del ERP. Detén el servidor con Ctrl+C.

## Conectar el ERP

Clona [erp-faspy](https://github.com/nahumsvr/erp-faspy) en otra carpeta y sigue su README. Ejecuta ambos proyectos en terminales separadas:

| Proyecto | Puerto | Configuración |
| --- | --- | --- |
| Faspy | 3000 | `.env.local`: `ERP_ORIGIN=http://localhost:3001` |
| ERP | 3001 | `.env`: `PORT=3001` y `NEXT_PUBLIC_API_URL=http://localhost:3000` |

Reinicia el servidor correspondiente después de cambiar variables. El ERP actual usa su servidor Express y `lib/api.ts` para consultar el core. Las llamadas directas de navegador al core requieren que su origen coincida con `ERP_ORIGIN`.

## Recorrido de demo

En [ERP](http://localhost:3001), elige un escenario, revisa los campos y pulsa **Evaluar factura**. La pantalla muestra la decisión, el estado fiscal, el score, el anticipo y la CLABE recibidos de Faspy.

- **Empresa elegible:** RFC `DIN890214ABC`, $150,000 a 60 días → anticipo de **$132,300**.
- **Rechazo fiscal:** RFC `CON950603VWX`.
- **Revisión:** RFC `XXX000101ABC`.

El ERP también conserva el recorrido de escritorio en [emisión](http://localhost:3001/emision). Usa los datos exactos de `lib/data/scenario.json` para emitir → aceptar anticipo → simular pago. El depósito es de $132,300; el pago devuelve principal de $132,300, comisión de $3,000 y remanente de $14,700. Son resultados sintéticos fijos: no hay persistencia ni verificación del orden de las llamadas. Otros IDs no están habilitados para depósito/pago y reciben HTTP 422.

El dashboard es una presentación independiente: sus métricas y tablas ilustrativas no se actualizan con cada factura enviada. La matriz de `/dashboard/matriz` usa cálculos de interfaz; `/dashboard/decision` sigue siendo un placeholder. No presentar estos datos como auditoría en tiempo real.

## Rutas y herramientas

| Ruta | Uso |
| --- | --- |
| `/dashboard` | Resumen de operaciones |
| `/dashboard/cumplimiento` | Vista ilustrativa de validaciones |
| `/dashboard/matriz` | Simulador visual interactivo |
| `/dashboard/mercado` | Presentación TAM/SAM/SOM |
| `GET /api/health` | Estado del servidor |
| `POST /api/emitir-factura` | Cumplimiento, scoring y oferta; latencia simulada de 700 ms |
| `POST /api/scoring/simulate` | Evaluación por monto, RFC y plazo |
| `POST /api/aceptar-anticipo` | Depósito simulado del escenario documentado |
| `POST /api/simular-pago` | Liquidación simulada del escenario documentado |
| `GET /api/compliance/audit` | Historial sintético precargado |

Importa el workspace [Bruno](docs/faspy/workspace.yml). Las peticiones incluyen headers, body, assertions y respuestas esperadas. Consulta el [contrato HTTP](docs/faspy/contract.md) antes de integrar otro cliente. Una decisión `rechazada` puede devolver HTTP 200: la petición fue procesada, aunque no se ofrece financiamiento.

## Comprobaciones

| Comando | Función |
| --- | --- |
| `pnpm dev` | Desarrollo en puerto 3000 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generación de tipos Next.js y TypeScript |
| `pnpm test` | Pruebas de datos, motor y API |
| `pnpm build` | Build de producción, obligatorio antes de integrar a main |
| `pnpm check` | Lint, tipos, pruebas y build |
| `pnpm test:smoke` | Pruebas HTTP con el servidor encendido |
| `pnpm start` | Servir el build de producción |

Desarrollo y build usan Webpack. `next/font` descarga Plus Jakarta Sans y JetBrains Mono durante el build; requiere acceso de red cuando las fuentes no están disponibles en caché.

## Problemas frecuentes

| Problema | Solución |
| --- | --- |
| Puerto 3000 ocupado | Comprueba si Faspy ya está ejecutándose; evita iniciar otra instancia. Si cambia el puerto, actualiza la URL del ERP. |
| ERP sin conexión | Revisa que ambos procesos estén activos y `NEXT_PUBLIC_API_URL` apunte al core. |
| Error CORS desde navegador | Usa el origen exacto de `ERP_ORIGIN`; `localhost` y `127.0.0.1` son orígenes diferentes. |
| Error al descargar fuentes | Comprueba acceso de red para el build. |
| Dependencias de otro sistema operativo | Vuelve a instalar las dependencias localmente con el lockfile; no copies `node_modules`. |
| HTTP 400 | Revisa el JSON y los campos del contrato; los plazos admitidos son 30, 60 y 90 días. |

## Estructura y coordinación

- `app/api/`: endpoints del simulador.
- `app/dashboard/`: interfaz del analista.
- `lib/engine/`: reglas deterministas sin llamadas financieras externas.
- `lib/data/`: fixtures sintéticos.
- `types/schema.ts`: contrato TypeScript.
- `docs/faspy/`: contrato y colección Bruno.

[Checklist MVP](docs/mvp-checklist.md) · [Documentación](docs/README.md) · [Sistema visual](DESIGN.md) · [ERP](https://github.com/nahumsvr/erp-faspy)

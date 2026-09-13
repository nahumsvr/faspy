# Base del proyecto y trabajo en paralelo

Fecha: 2026-09-12. Referencias: AGENTS.md (alcance) y DESIGN.md (diseño).
Se conserva App Router en la raíz y el alias @/*; no hay migración a src/.

## Estructura y responsables

| Área | Ubicación | Responsable |
| --- | --- | --- |
| Endpoints y protocolo HTTP | app/api/, lib/api/ | P1 |
| Validación y scoring puros | lib/engine/ | P1 |
| Fixtures sintéticos | lib/data/ | P1, coordinación con P3 |
| Cumplimiento | app/dashboard/cumplimiento/ | P3 |
| Matriz de decisión | app/dashboard/decision/ | P3 |
| TAM/SAM | app/dashboard/mercado/ | P3 |
| Componentes del dashboard | components/dashboard/ | P3 |
| Primitivas compartidas | components/ui/ | P3, cambios coordinados |
| Diseño global | styles/tokens.css, app/globals.css, app/layout.tsx | P3 |
| Contrato compartido | types/schema.ts | P1 + responsable ERP |
| Requests de Bruno | docs/faspy/collections/api/ | Autor del endpoint |
| Calidad | tests/, scripts/, .github/workflows/ | Todos |

Las carpetas engine y data incluyen instrucciones para quedar versionadas sin inventar
reglas financieras ni fixtures antes de tener contrato.

## Secuencia de integración

1. Base inicial: entorno, estilos, navegación, health, CORS y comandos de verificación.
2. P1 acuerda el contrato con ERP; copia el mismo schema en ambos repositorios,
   añade ejemplos JSON y documenta campos, errores, unidades y estados.
3. P1 desarrolla motor y endpoints; P3 desarrolla módulos con fixtures del mismo contrato.
   Las pantallas y componentes visuales ya pueden desarrollarse en paralelo.
4. Integrar los endpoints reales simulados, probar requests con Bruno o curl,
   correr pnpm check y pnpm test:smoke antes de fusionar.

No existe types/schema.ts en el repo vecino erp-faspy inspeccionado al crear esta base.
El schema actual define solamente HealthResponse y ApiError de infraestructura;
NO está certificado como espejo del ERP. Esta sincronización es requisito de la
integración de facturas, no de la construcción independiente de la UI.

## Acuerdos para evitar conflictos

Crear ramas desde develop (por ejemplo codex/api-validaciones o codex/dashboard-cumplimiento).
Repartir archivos por área antes de editar. Cada persona puede usar un worktree y un
puerto distinto: pnpm dev --port 3002. Cambiar ERP_ORIGIN según el frontend real.
Coordinar package.json, lockfile, schema, layout y tokens: tienen consumidores compartidos.
No renombrar campos publicados; documentar adiciones y actualizar ambos repositorios.
Cada cambio a endpoints incluye request de Bruno y prueba HTTP.
No se incluye código app/erp: pertenece al repo separado.

## Convenciones

- pnpm es el gestor canónico; no generar package-lock.json ni yarn.lock.
- Componentes de servidor por defecto; use client solo cuando se necesita interacción.
- Los handlers usan apiJson y exportan OPTIONS = apiOptions. CORS admite ERP_ORIGIN,
  Content-Type y métodos GET/POST/OPTIONS; ampliar al incorporar otros métodos.
- CORS es política del navegador, no autenticación. El simulador no tiene login.
- Rechazar cuerpos inválidos con JSON tipado y un estado 400 al añadir endpoints.
- El futuro POST /api/emitir-factura incluye la pausa intencional de 700 ms en el handler.
- No persistencia, servicios externos de negocio, ni efectos de red en lib/engine.
- Los colores del frontmatter de DESIGN.md prevalecen sobre valores diferentes del texto.
  Las fuentes son Plus Jakarta Sans y JetBrains Mono; los estilos globales son claros.
- Las páginas actuales son puntos de entrada vacíos explícitos, sin métricas inventadas.

## Hecho en esta etapa

Estructura versionable, shell navegable, fuentes/tokens, entorno de ejemplo, ruta health,
helpers HTTP, pruebas unitarias/HTTP, CI y documentación. No se implementan todavía
facturación, scoring, métricas ni validaciones de negocio: son los frentes siguientes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Qué es este proyecto

Backend + Dashboard del simulador Capital One Faspy para un hackathon.
Next.js App Router. Este repo NO tiene login real, NO tiene base de datos real,
NO se conecta a SAT/SPEI reales. Todo es simulado con reglas + JSON precargado.

## Estructura

- `app/api/*` → rutas del motor de simulación (dueño: P1)
- `app/dashboard/*` → Centro de Cumplimiento, Matriz de Decisión, TAM/SAM (dueño: P3)
- `lib/engine/*` → lógica pura de validación/scoring, sin efectos secundarios de red real
- `lib/data/*.json` → datos precargados, NO modificar estructura sin avisar al equipo
- `types/schema.ts` → contrato de datos, espejo exacto de `erp-faspy/types/schema.ts`

## Comandos

- Instalar: `pnpm install --frozen-lockfile` (Node 24, pnpm 11.2.2)
- Desarrollo: `pnpm dev` (puerto 3000)
- Build (correr SIEMPRE antes de mergear a main): `pnpm build`
- Verificación completa: `pnpm check` (lint, tipos, pruebas y build)
- Pruebas HTTP con servidor activo: `pnpm test:smoke`

## Reglas para el agente

- Nunca agregues autenticación real, ORM, ni llamadas a APIs externas reales (SAT, SPEI, OFAC).
  Todo debe resolverse con datos en `lib/data/*.json` y funciones deterministas en `lib/engine/*`.
- Los endpoints en `app/api/*` deben responder siempre en formato JSON según `types/schema.ts`.
  No cambies los nombres de campos existentes; si falta un campo, agrégalo sin romper los existentes.
- Agrega un `await new Promise(r => setTimeout(r, 700))` en `/api/emitir-factura` para simular
  latencia real de validación — es intencional, no un bug.
- CORS: `app/api/*` debe permitir el origen de `erp-faspy` (ver `.env.example` para la URL).
- No toques `app/erp/*` — ese código vive en otro repo (`erp-faspy`).
- Mantén siempre actualizada la colección Bruno (`docs/faspy/workspace.yml` y `docs/faspy/collections/api/`): cada endpoint nuevo o cambio de contrato debe incluir o actualizar su request, headers, body, status, assertions y ejemplo de respuesta esperada. No dar por terminada una API sin reflejarla en Bruno.
- Revisa y mantén actualizado `docs/mvp-checklist.md`: es la fuente de verdad del avance del MVP,
  las tareas completadas, las pendientes y la coordinación del equipo. Cada vez que implementes una
  feature, endpoint, componente o cambie el alcance, actualiza el checklist correspondiente.

## Cómo probar

- Usar el workspace Bruno `docs/faspy/workspace.yml` y sus requests en `docs/faspy/collections/api/`.
- Antes de dar por "listo" un endpoint, probarlo con `curl` o Postman, no solo desde el navegador.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

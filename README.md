# EcoStream · Faspy

Backend y dashboard del simulador Capital One EcoStream. Todas las validaciones son
simuladas; sin autenticación, base de datos ni conexiones reales a SAT, SPEI u OFAC.

## Desarrollo

Usar Node 24 y pnpm 11.2.2 (ver `.nvmrc` y `packageManager`).

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Dashboard: http://localhost:3000/dashboard. ERP: http://localhost:3001 por defecto.
Configurar `ERP_ORIGIN` en `.env.local` si cambia el origen del ERP y reiniciar el servidor.

## Verificación

`pnpm check` ejecuta lint, generación de tipos, TypeScript, pruebas y build.
`pnpm test` prueba los helpers compartidos. Con el servidor encendido:
`pnpm test:smoke` verifica rutas y CORS por HTTP.
El build descarga Plus Jakarta Sans y JetBrains Mono mediante next/font; necesita red
la primera vez. En producción las fuentes se sirven desde la propia aplicación.
Desarrollo y build usan Webpack: Turbopack falló al abrir un puerto interno en el
entorno de preparación. Puede reevaluarse por separado sin cambiar la arquitectura.

## Trabajo en paralelo

Consultar el [plan y reparto](docs/architecture/initial-setup.md) antes de comenzar.
El dashboard tiene estructura navegable; los módulos y reglas de negocio están pendientes.
El contrato de facturas debe acordarse con el ERP antes de integrar ambos repositorios.

[Documentación y colección Bruno](docs/README.md) · [Checklist MVP](docs/mvp-checklist.md) · [Sistema visual](DESIGN.md)

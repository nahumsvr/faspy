# Documentación de EcoStream

- [Plan de estructura y trabajo en paralelo](architecture/initial-setup.md).
- [Checklist y Diagnóstico del MVP](mvp-checklist.md).
- [Sistema visual](../DESIGN.md).
- [Arranque y comandos](../README.md).
- Colección Bruno/OpenCollection: abrir `docs/faspy/workspace.yml` en Bruno.
  La carpeta `docs/faspy/collections/api/` contiene requests ejecutables por ruta y
  escenarios de aprobación, rechazo, errores y preflight, con body, headers, status
  esperado, assertions y ejemplo de respuesta.

Bruno es el cliente de API usado para versionar requests, no una persona responsable
de la documentación. Agregar cada request junto con su endpoint.
Formato de referencia: [OpenCollection YAML de Bruno](https://docs.usebruno.com/opencollection-yaml/structure-reference).

## Comprobación inicial

Con `pnpm dev` activo, ejecutar `pnpm test:smoke` o:

```sh
curl -i http://localhost:3000/api/health
curl -i -X OPTIONS http://localhost:3000/api/health -H 'Origin: http://localhost:3001' -H 'Access-Control-Request-Method: GET'
```

La respuesta GET es `{"status":"ok","service":"ecostream","mode":"simulation"}`.
OPTIONS retorna 204 con el origen autorizado. Otros orígenes no reciben
Access-Control-Allow-Origin. No se necesitan credenciales.

La colección de Postman mencionada anteriormente en AGENTS.md se sustituye por el
workspace Bruno existente; los checks automatizados de HTTP viven en scripts/smoke.mjs.
Las requests de emisión, auditoría y scoring son ejecutables con la API actual; las
de anticipo y liquidación siguen documentando contratos de fases posteriores.

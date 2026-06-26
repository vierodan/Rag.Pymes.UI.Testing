# Plan de Ejecucion: SPA Demo Test RagPymes

## Objetivo

Transformar la SPA actual de RagPymes desde un explorador tecnico de endpoints hacia una demo guiada, similar en diseno y funcionalidad al frontend de referencia de Visiotech. La aplicacion debe permitir probar la API real de RagPymes con flujos comprensibles: conexion, health checks, tenants, invitaciones, membresias, knowledge bases, documentos, ingestion, busqueda y respuestas RAG. El explorador raw de endpoints debe conservarse como herramienta avanzada, no como experiencia principal.

## Principios de Ejecucion

- Mantener React + Vite + TypeScript estricto.
- Usar `api-definition/RagPymes-v1.json` como contrato formal y `src/data/postmanCollection.json` como fuente de ejemplos operativos.
- No modificar `../rag-pymes-backend/` salvo peticion explicita.
- Mantener toda la documentacion en `docs/`, con un unico `README.md` en la raiz.
- Priorizar UX de demo guiada: paneles por caso de uso, resultados legibles y acciones repetibles.

## Fase 1: Reestructurar la Arquitectura Frontend

Crear una estructura similar al frontend de Visiotech:

- `src/components/layout/`: `AppShell`, `Header`, `MainContent`.
- `src/components/shared/`: `SectionCard`, badges, paneles reutilizables.
- `src/pages/HomePage.tsx`: hero, resumen del contrato y entrada a la demo.
- `src/features/ragPymesApiDemo/`: componentes funcionales de prueba.
- `src/api/`: cliente HTTP, configuracion, errores y contratos TypeScript.
- Migrar estilos globales a `src/styles/globals.css` y estilos por componente a CSS Modules.

El objetivo de esta fase es separar layout, dominio API y UI de pruebas antes de ampliar funcionalidad.

### Prompt Profesional para Ejecutar la Fase 1

```text
Actua como ingeniero frontend senior especializado en React + Vite + TypeScript. Refactoriza esta SPA de RagPymes para alinearla con una arquitectura de demo guiada similar al frontend de referencia de Visiotech, sin copiar codigo literalmente y sin tocar el backend.

Objetivos:
1. Crear componentes de layout: AppShell, Header y MainContent.
2. Crear un componente compartido SectionCard.
3. Mover la pantalla principal a src/pages/HomePage.tsx.
4. Crear la carpeta src/features/ragPymesApiDemo/ para la demo funcional.
5. Mantener el endpoint explorer actual funcionando mientras se reorganiza.
6. Sustituir el CSS global monolitico por globals.css y CSS Modules por componente.

Restricciones:
- Mantener TypeScript estricto.
- No perder ninguna funcionalidad existente.
- No crear mas README.md.
- Actualizar documentacion en docs/ si cambia la estructura.

Verificacion:
- Ejecuta npm run build.
- Ejecuta npm test -- --run --passWithNoTests.
- Resume los archivos modificados y cualquier deuda tecnica detectada.
```

## Fase 2: Crear Capa API Tipada para RagPymes

Implementar una capa API separada del UI:

- `apiConfig.ts`: base URL desde `VITE_RAGPYMES_API_BASE_URL`, timeout y estado de configuracion.
- `httpClient.ts`: `GET`, `POST`, `PATCH`, `DELETE`, soporte Bearer token, JSON, `FormData`, timeouts y errores tipados.
- `apiError.ts`: normalizacion de `ProblemDetails`.
- `contracts.ts`: tipos principales derivados manualmente de OpenAPI para requests/responses de alto valor.
- `ragPymesApi.ts`: funciones por dominio: health, tenants, invitations, memberships, knowledge bases, documents, ingestion, search y answers.

El endpoint explorer puede seguir usando Postman/OpenAPI, pero los flujos guiados deben usar esta capa API.

### Prompt Profesional para Ejecutar la Fase 2

```text
Actua como arquitecto frontend senior y crea una capa API tipada para RagPymes basada en api-definition/RagPymes-v1.json y src/data/postmanCollection.json.

Implementa:
1. src/api/apiConfig.ts con base URL configurable, timeout y helper hasConfiguredApi.
2. src/api/httpClient.ts con fetch, query params, JSON, FormData, Bearer token opcional, AbortController y errores HTTP.
3. src/api/apiError.ts para parsear ProblemDetails y mensajes de error.
4. src/api/contracts.ts con DTOs TypeScript para los endpoints principales.
5. src/api/ragPymesApi.ts con metodos agrupados por dominio.

Prioriza estos flujos:
- health/live/ready
- tenant registration y tenant provisioning
- list/get tenants
- invitations
- memberships
- knowledge bases
- document upload, ingestion runs y reindex
- search y answers

Restricciones:
- No generes tipos ficticios si el contrato no los respalda.
- Usa nombres de DTO alineados con OpenAPI.
- Mantén el endpoint explorer actual como herramienta avanzada.

Verificacion:
- npm run build.
- npm test -- --run --passWithNoTests.
- Documenta en docs/api-testing.md como se usa la capa API.
```

## Fase 3: Redisenar Home y Shell Visual

Adoptar una experiencia visual parecida a Visiotech:

- Header con marca RagPymes, estado de API y base URL.
- Hero con proposito claro: probar la API real sin inventar contratos.
- Bloques de resumen: OpenAPI-first, Postman examples, HTTP real, flujos RAG.
- Tarjetas con roadmap funcional.
- Paleta profesional propia de RagPymes, evitando copiar la paleta exacta de Visiotech.

El diseno debe sentirse como una herramienta de testing operativa, no una landing page de marketing.

### Prompt Profesional para Ejecutar la Fase 3

```text
Actua como frontend designer-engineer senior. Rediseña la Home de RagPymes tomando como inspiracion la estructura del frontend Visiotech: shell, header, hero, tarjetas y secciones funcionales. No copies literalmente textos, clases ni paleta.

Objetivos:
1. Crear una identidad visual propia para RagPymes API Testing SPA.
2. Mostrar estado de configuracion: API base URL, contrato OpenAPI y coleccion Postman.
3. Presentar la app como una herramienta operativa de pruebas API.
4. Usar SectionCard para organizar las secciones.
5. Mantener legibilidad en desktop y mobile.

Restricciones:
- No usar una landing decorativa vacia.
- No ocultar la funcionalidad principal debajo de marketing copy.
- Mantener texto claro y breve.

Verificacion:
- npm run build.
- Revisar manualmente en el navegador local que no haya solapes ni texto cortado.
```

## Fase 4: Implementar Panel de Conexion y Health Checks

Crear una primera seccion funcional para validar que el backend responde:

- Configuracion de base URL.
- Token Bearer opcional.
- Botones para `GET /health`, `/health/live`, `/health/ready`.
- Mostrar estado, latencia, payload y errores `ProblemDetails`.
- Guardar token/base URL en estado local del frontend; considerar `localStorage` solo si se advierte al usuario.

Esta fase debe dar feedback inmediato antes de ejecutar operaciones con datos de negocio.

### Prompt Profesional para Ejecutar la Fase 4

```text
Actua como ingeniero frontend senior enfocado en DX y testing de APIs. Implementa un panel de conexion y health checks para RagPymes.

Debe incluir:
1. Campo editable de base URL.
2. Campo de Bearer token opcional.
3. Botones para GET /health, GET /health/live y GET /health/ready.
4. Visualizacion de status HTTP, latencia, payload y errores normalizados.
5. Badge de estado de conexion en Header.

Usa la nueva capa api/httpClient y ragPymesApi, no fetch directo en componentes salvo justificacion.

Verificacion:
- Probar con backend apagado y mostrar error util.
- Probar con base URL invalida y mostrar error util.
- npm run build.
```

## Fase 5: Implementar Flujos de Access Management

Crear paneles guiados para probar:

- Registrar tenant self-service.
- Provisionar tenant tecnico.
- Listar tenants.
- Obtener tenant por `tenantId`.
- Invitar usuario por email.
- Aceptar invitacion por token.
- Listar/revocar invitaciones.
- Listar memberships, cambiar rol y revocar membership.

Los formularios deben reutilizar variables comunes (`tenantId`, `membershipId`, `invitationId`, `token`) y capturar IDs relevantes desde respuestas para reducir friccion.

### Prompt Profesional para Ejecutar la Fase 5

```text
Actua como product engineer senior. Crea flujos guiados de Access Management para la SPA de RagPymes usando el contrato OpenAPI y ejemplos Postman.

Implementa paneles para:
1. Tenant onboarding: register tenant y provision tenant.
2. Tenant administration: list tenants y get tenant.
3. Invitations: create, list, accept y revoke.
4. Memberships: list, change role y revoke.

Requisitos UX:
- Formularios compactos con valores iniciales de Postman cuando existan.
- Capturar IDs devueltos por respuestas y permitir reutilizarlos en variables compartidas.
- Mostrar errores ProblemDetails de forma legible.
- Mostrar endpoint, metodo y operationId en cada accion.

Restricciones:
- No inventar roles fuera de los documentados.
- No enviar campos de actor autenticado si Postman indica que vienen del token.

Verificacion:
- npm run build.
- Documentar variables compartidas nuevas en docs/api-testing.md.
```

## Fase 6: Implementar Flujos de Knowledge

Crear paneles guiados para:

- Crear/listar/obtener knowledge bases.
- Subir documento con `multipart/form-data`.
- Obtener/eliminar documento.
- Listar ingestion runs.
- Obtener ingestion run.
- Lanzar reindex.
- Buscar contenido.
- Generar respuestas RAG fundamentadas.

Esta fase debe cuidar especialmente `tenantId`, `knowledgeBaseId`, `documentId` e `ingestionRunId`.

### Prompt Profesional para Ejecutar la Fase 6

```text
Actua como ingeniero senior de aplicaciones RAG y frontend. Implementa los flujos Knowledge de RagPymes en la SPA de testing.

Debe cubrir:
1. Knowledge bases: create, list, get.
2. Documents: upload multipart, get, delete.
3. Ingestion: list runs, get run, start reindex.
4. Retrieval: searches.
5. RAG: answers con pregunta, topK y filtros opcionales.

Requisitos UX:
- Reutilizar variables globales tenantId, knowledgeBaseId, documentId e ingestionRunId.
- Capturar IDs automaticamente desde respuestas cuando sea posible.
- En uploads, usar FormData real y no fijar manualmente Content-Type.
- Mostrar citas, resultados y metadata de respuestas RAG de forma legible cuando existan.

Restricciones:
- No registrar documentos completos, tokens ni prompts sensibles en logs.
- No asumir estados de ingestion no definidos por el contrato.

Verificacion:
- npm run build.
- Probar al menos health y un flujo con backend disponible si el entorno lo permite.
```

## Fase 7: Convertir el Endpoint Explorer en Herramienta Avanzada

El explorador raw actual debe mantenerse, pero reorganizado:

- Ubicarlo como seccion "Advanced endpoint explorer".
- Mantener filtros por metodo, path y texto.
- Mostrar Postman description, OpenAPI contract, request body y response.
- Permitir ejecutar cualquier endpoint no cubierto por paneles guiados.
- Evitar que sea la primera experiencia de la app.

### Prompt Profesional para Ejecutar la Fase 7

```text
Actua como ingeniero frontend senior. Reubica el endpoint explorer existente como herramienta avanzada dentro de la nueva demo RagPymes.

Objetivos:
1. Mantener todas las capacidades actuales del explorer.
2. Integrarlo visualmente con SectionCard y CSS Modules.
3. Reutilizar configuracion global de base URL, token y variables compartidas.
4. Mostrar contrato OpenAPI y descripcion Postman por endpoint.
5. Evitar duplicar logica HTTP si ya existe httpClient.

Restricciones:
- No perder endpoints.
- No romper soporte multipart/form-data.
- No convertir el explorer en la experiencia principal.

Verificacion:
- Comparar OpenAPI vs Postman: ambos deben seguir en 34 endpoints.
- npm run build.
```

## Fase 8: Seed, Escenarios y Documentacion Operativa

Crear documentacion y, si procede, scripts de ayuda:

- `docs/api-testing.md`: flujos manuales recomendados.
- `docs/spa-demo-test.md`: este plan y su estado.
- Opcional: `scripts/seed.ts` para datos de prueba si el backend expone endpoints adecuados y el usuario lo pide.
- Checklist de pruebas smoke.
- Reglas para refrescar Postman/OpenAPI cuando cambie el backend.

### Prompt Profesional para Ejecutar la Fase 8

```text
Actua como technical writer e ingeniero frontend senior. Documenta el uso operativo de la SPA de testing RagPymes y prepara una base para escenarios repetibles.

Implementa:
1. Actualizar docs/api-testing.md con flujos manuales paso a paso.
2. Documentar como refrescar src/data/postmanCollection.json y api-definition/RagPymes-v1.json.
3. Crear checklist de smoke tests: health, tenant, knowledge base, document upload, search, answer.
4. Si procede, proponer scripts de seed, pero no implementarlos sin confirmar que el backend soporta un flujo estable.
5. Mantener README.md enlazando todos los Markdown relevantes.

Restricciones:
- No crear README.md adicionales.
- No duplicar documentacion larga en README.
- No incluir tokens, datos sensibles ni documentos reales completos.

Verificacion:
- find . -name README.md debe devolver solo ./README.md.
- README.md debe enlazar los Markdown del proyecto.
- npm run build.
```

## Fase 9: Validacion Final y Calidad

Cerrar la migracion con controles de calidad:

- `npm run build`.
- `npm test -- --run --passWithNoTests` hasta que existan tests reales.
- Prueba visual desktop/mobile.
- Validar que no hay diferencias entre OpenAPI y Postman.
- Revisar `.gitignore` y estado Git.
- Crear tests unitarios para parser Postman/OpenAPI y cliente HTTP cuando la estructura este estabilizada.

### Prompt Profesional para Ejecutar la Fase 9

```text
Actua como staff engineer haciendo una verificacion final de calidad para la SPA RagPymes.

Ejecuta y corrige:
1. npm run build.
2. npm test -- --run --passWithNoTests.
3. Comparacion OpenAPI vs Postman para asegurar paridad de endpoints.
4. Revision visual responsive de la UI.
5. Revision de estado Git e ignorados.
6. Identificacion de riesgos restantes y tests que conviene agregar.

Entrega:
- Lista breve de cambios validados.
- Bugs corregidos.
- Riesgos pendientes.
- Comandos ejecutados y resultado.
```

## Resultado Esperado

Al completar las fases, la SPA de RagPymes debe sentirse como una herramienta de demostracion y testing operativa: guiada por flujos reales, visualmente consistente, apoyada en OpenAPI/Postman, facil de extender y capaz de ejecutar tanto escenarios principales como endpoints avanzados.

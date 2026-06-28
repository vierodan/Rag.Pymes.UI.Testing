# Misión del proyecto

## ¿Qué estamos construyendo?

Estamos construyendo una SPA interna, desarrollada con React y Vite, para probar de forma operativa la API backend de RagPymes desde un navegador. Este workspace no implementa la lógica de negocio del backend: proporciona una interfaz frontend de validación, exploración y demostración que permite ejecutar flujos reales contra la API de RagPymes, inspeccionar sus respuestas y confirmar que las suposiciones del frontend coinciden con los contratos publicados.

La aplicación existe para facilitar el trabajo de desarrollo, revisión y validación mientras evoluciona el backend. Su objetivo principal es reducir la fricción al probar endpoints, reproducir escenarios frecuentes y detectar rápidamente discrepancias entre la experiencia frontend, la colección Postman, el contrato OpenAPI y el comportamiento real de la API.

## Propósito

La misión del proyecto es ofrecer una herramienta de escritorio, clara y densa en información, que permita:

- Configurar la URL base de la API y un token Bearer opcional para entornos de prueba.
- Ejecutar comprobaciones de salud del backend y diagnosticar problemas de conectividad, CORS, autenticación o disponibilidad.
- Probar flujos guiados de Access Management, incluyendo registro o provisión de tenants, invitaciones, membresías y roles documentados.
- Probar flujos de Knowledge, incluyendo bases de conocimiento, subida de documentos, ejecuciones de ingesta, reindexado, búsqueda semántica y generación de respuestas RAG fundamentadas.
- Reutilizar variables compartidas, como `tenantId`, `membershipId`, `invitationId`, `knowledgeBaseId`, `documentId` e `ingestionRunId`, para encadenar operaciones sin copiar manualmente cada identificador.
- Mantener un explorador avanzado de endpoints para ejecutar cualquier operación disponible en la colección Postman y contrastarla con el contrato OpenAPI.

## Contexto del producto

RagPymes necesita una forma práctica de validar su API durante el desarrollo. La documentación del proyecto define este repositorio como una aplicación React + Vite cuyo propósito es probar el backend situado fuera de este workspace, en `../rag-pymes-backend/`.

El backend es la fuente de verdad para rutas, DTOs, reglas de validación, autenticación y respuestas esperadas. Este frontend consume artefactos locales derivados del backend:

| Artefacto | Función |
| --- | --- |
| `src/data/postmanCollection.json` | Catálogo operativo de endpoints copiado desde la colección Postman del backend. |
| `api-definition/RagPymes-v1.json` | Contrato formal OpenAPI usado para enriquecer la experiencia de prueba. |
| `src/api/` | Capa API tipada para ejecutar flujos guiados de forma consistente. |
| `docs/api-testing.md` | Guía operativa para probar la API, refrescar artefactos y ejecutar escenarios smoke. |
| `docs/spa-demo-test.md` | Plan de evolución de la SPA hacia una demo guiada de pruebas. |

## Usuarios objetivo

Esta herramienta está pensada para:

- Desarrolladores frontend que necesitan validar integración con la API real.
- Desarrolladores backend que quieren comprobar rápidamente contratos, errores y flujos expuestos.
- Revisores técnicos que necesitan reproducir escenarios de API desde una interfaz visual.
- QA o perfiles técnicos que ejecutan pruebas manuales en entornos no productivos.
- Nuevos miembros del equipo que necesitan entender los flujos principales de RagPymes sin empezar directamente por llamadas aisladas.

## Alcance

| Área | Incluido |
| --- | --- |
| Pruebas de conectividad | Health checks, estado de API, latencia, payloads y errores normalizados. |
| Access Management | Tenants, invitaciones, membresías y roles soportados por el contrato. |
| Knowledge | Bases de conocimiento, documentos, ingesta, reindexado, búsqueda y respuestas RAG. |
| Exploración avanzada | Ejecución manual de endpoints desde Postman/OpenAPI. |
| Operación local | Uso desde navegador de escritorio contra un backend local o de prueba. |
| Documentación | Guías de uso, refresco de artefactos y escenarios smoke bajo `docs/`. |

## Fuera de alcance

| Área | Motivo |
| --- | --- |
| Implementar comportamiento backend | La lógica de negocio vive en `../rag-pymes-backend/`, que es la fuente de verdad. |
| Modificar el backend desde este workspace | El backend se usa solo como contexto de lectura para este proyecto. |
| Sustituir Postman, OpenAPI o pruebas automatizadas backend | La SPA complementa esos artefactos; no los reemplaza. |
| Usar datos reales sensibles | Las pruebas deben realizarse con datos sintéticos o no sensibles. |
| Optimización móvil prioritaria | El objetivo principal son navegadores de escritorio y portátiles. |

## Principios de construcción

- La experiencia principal debe ser una demo guiada por flujos, no una lista cruda de endpoints.
- El explorador avanzado debe conservarse para casos no cubiertos por los paneles guiados.
- Las llamadas API deben pasar por la capa tipada de `src/api/` siempre que formen parte de un flujo de aplicación.
- No se debe inventar comportamiento del backend. Si un endpoint, payload o estado no está confirmado por OpenAPI, Postman o el backend, debe tratarse como desconocido.
- Los errores deben mostrarse de forma legible, especialmente cuando la API devuelve `ProblemDetails`.
- Las subidas de documentos deben usar `FormData` real y dejar que el navegador gestione los límites multipart y la cabecera `Content-Type`.
- La aplicación no debe registrar documentos completos, tokens, prompts sensibles ni secretos en logs, capturas, incidencias o comentarios.
- La documentación debe mantenerse bajo `docs/`, con un único `README.md` en la raíz del workspace.

## Resultado esperado

El resultado esperado es una herramienta interna que permita abrir la SPA, apuntarla a un backend RagPymes, ejecutar flujos representativos y obtener evidencia clara sobre:

- si el backend responde;
- si la autenticación y los permisos son adecuados;
- si los contratos Postman y OpenAPI están alineados;
- si los flujos de tenants y conocimiento funcionan de extremo a extremo;
- si los errores son comprensibles para diagnosticar problemas;
- y si el frontend está integrándose con la API sin asumir comportamientos no documentados.

En resumen, este proyecto construye el entorno visual de prueba y validación de la API de RagPymes: una SPA de apoyo técnico para desarrollar, revisar y operar mejor los flujos principales del producto mientras el backend continúa siendo la fuente de verdad.

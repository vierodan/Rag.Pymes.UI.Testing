# Stack tecnológico y convenciones

## 1. Propósito

Este documento define las tecnologías, herramientas y convenciones que deben guiar el desarrollo de este workspace. Su objetivo es mantener la SPA de pruebas de RagPymes coherente, mantenible y alineada con los contratos del backend.

Este fichero no sustituye a `README.md`, `AGENTS.md` ni a la documentación operativa bajo `docs/`; funciona como una referencia constitucional para decidir cómo construir y mantener el frontend.

## 2. Stack base

| Área | Tecnología | Versión declarada | Uso en el proyecto |
| --- | --- | ---: | --- |
| Runtime frontend | React | `^19.0.0` | Construcción de la interfaz de usuario. |
| Renderizado React | React DOM | `^19.0.0` | Montaje de la SPA en el navegador. |
| Build tool | Vite | `^7.3.1` | Servidor local, build y preview. |
| Plugin Vite | `@vitejs/plugin-react` | `^5.0.0` | Integración de React con Vite. |
| Lenguaje | TypeScript | `^5.9.3` | Tipado estricto de aplicación, API y contratos. |
| Tests | Vitest | `^4.0.0` | Ejecución de pruebas unitarias y de comportamiento. |
| Testing UI | React Testing Library | `^16.3.0` | Pruebas centradas en comportamiento visible para el usuario. |
| Matchers de test | `@testing-library/jest-dom` | `^6.9.1` | Aserciones DOM más expresivas. |
| DOM de test | jsdom | `^27.2.0` | Entorno DOM para pruebas frontend. |
| Linting | ESLint | `^10.5.0` | Análisis estático de código. |
| Linting TypeScript | `typescript-eslint` | `^8.62.0` | Reglas ESLint para TypeScript. |
| Gestor de paquetes | npm | Según `package-lock.json` | Instalación reproducible de dependencias. |

## 3. Configuración de compilación

| Archivo | Responsabilidad |
| --- | --- |
| `vite.config.ts` | Configura React para Vite y fija `dev` y `preview` en el puerto `22000` con `strictPort: true`. |
| `tsconfig.json` | Orquesta las referencias a la configuración de aplicación y Node. |
| `tsconfig.app.json` | Configura TypeScript estricto para el código de `src/`. |
| `tsconfig.node.json` | Configura TypeScript estricto para `vite.config.ts`. |
| `package.json` | Define scripts, dependencias y metadatos del paquete. |
| `package-lock.json` | Bloquea versiones resueltas para instalaciones reproducibles con npm. |

Convenciones de TypeScript:

- Usar TypeScript de forma preferente para todo el código de aplicación.
- Mantener `strict: true`.
- No permitir JavaScript en `src/` como convención general; `allowJs` está desactivado.
- Usar módulos ES y resolución `Bundler`, según la configuración vigente.
- Usar JSX automático con `jsx: "react-jsx"`.
- Mantener `resolveJsonModule: true` para consumir artefactos locales como Postman y OpenAPI.

## 4. Scripts oficiales

Los scripts de `package.json` son la fuente de verdad. No se deben inventar comandos alternativos sin actualizar `package.json` y la documentación correspondiente.

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Inicia el servidor local de Vite. |
| `npm run build` | Ejecuta `tsc -b` y genera el bundle de producción con Vite. |
| `npm run preview` | Sirve localmente el bundle generado. |
| `npm test` | Ejecuta la suite de Vitest. |
| `npm run lint` | Ejecuta ESLint sobre el workspace. |

Notas:

- La aplicación local se sirve en `http://localhost:22000`.
- No hay script `format` declarado en `package.json` en el estado actual del repositorio.
- ESLint está declarado como dependencia y script, pero no se ha detectado una configuración versionada de ESLint en la raíz del proyecto.

## 5. Estructura de carpetas

| Ruta | Convención |
| --- | --- |
| `src/` | Código de aplicación. |
| `src/api/` | Capa API tipada: configuración, cliente HTTP, errores, contratos y métodos por dominio. |
| `src/components/layout/` | Componentes de estructura como `AppShell`, `Header` y `MainContent`. |
| `src/components/shared/` | Componentes de presentación reutilizables, como `SectionCard`. |
| `src/features/ragPymesApiDemo/` | Experiencia funcional de prueba de la API RagPymes. |
| `src/features/ragPymesApiDemo/components/` | Paneles guiados y explorador avanzado de endpoints. |
| `src/pages/` | Vistas principales de la SPA, como `HomePage.tsx`. |
| `src/lib/` | Utilidades compartidas que no pertenecen directamente a la capa API. |
| `src/types/` | Tipos compartidos para contratos auxiliares y modelos de UI. |
| `src/data/` | Artefactos de datos consumidos por la SPA, como la colección Postman. |
| `src/styles/` | Estilos globales y tokens base. |
| `docs/` | Documentación técnica y operativa del proyecto. |
| `api-definition/` | Contrato OpenAPI local de RagPymes. |
| `sdd/constitution/` | Documentación constitucional del proyecto. |

## 6. Convenciones de código

- Usar indentación de 2 espacios.
- Nombrar componentes React en PascalCase, por ejemplo `TenantSelector.tsx`.
- Nombrar funciones, variables, hooks y ficheros no componente en camelCase.
- Prefijar hooks personalizados con `use`, por ejemplo `useTenantApi.ts`.
- Preferir exports nombrados en módulos compartidos.
- Mantener componentes enfocados en una responsabilidad.
- Mover lógica transversal a `src/lib/`, hooks dedicados o a la capa `src/api/`, según corresponda.
- Evitar duplicar lógica HTTP dentro de componentes.
- No codificar comportamiento backend supuesto. Si el contrato no confirma un endpoint, payload o respuesta, debe revisarse el backend o marcarse como desconocido.

## 7. Convenciones de frontend y UX

La SPA es una herramienta interna de pruebas para escritorio y portátiles. Las decisiones de interfaz deben priorizar:

- densidad de información;
- lectura rápida de estados, payloads y errores;
- flujos guiados repetibles;
- controles operativos claros;
- resultados de API legibles;
- mínima fricción para encadenar operaciones.

Convenciones específicas:

- La experiencia principal debe ser una demo guiada por casos de uso, no un listado crudo de endpoints.
- El explorador avanzado debe mantenerse disponible para operaciones no cubiertas por los paneles guiados.
- La interfaz debe conservar una orientación de herramienta operativa, no de landing page.
- La optimización móvil no es prioritaria salvo petición explícita.
- Los paneles deben mostrar método, endpoint, estado, latencia, respuesta y errores cuando sea útil para depurar.

## 8. Convenciones de estilos

- Usar `src/styles/globals.css` para tokens, estilos base y valores globales.
- Usar CSS Modules para estilos de componentes.
- Evitar concentrar estilos de componentes específicos en el CSS global.
- Mantener nombres de clases locales y expresivos dentro de cada módulo CSS.
- No introducir un sistema de diseño nuevo sin necesidad clara.
- Respetar la identidad visual propia de RagPymes definida por la SPA, sin copiar literalmente estilos de otros frontends de referencia.

## 9. Convenciones de API

El backend RagPymes vive fuera del workspace en `../rag-pymes-backend/` y es la fuente de verdad para rutas, DTOs, validaciones, autenticación y respuestas esperadas.

| Elemento | Convención |
| --- | --- |
| Cliente API | Usar `src/api/ragPymesApi.ts` para flujos de aplicación. |
| HTTP común | Usar `src/api/httpClient.ts` para `fetch`, query params, JSON, `FormData`, Bearer token, timeouts y `AbortSignal`. |
| Errores | Usar `src/api/apiError.ts` para normalizar `ProblemDetails`. |
| Contratos | Usar `src/api/contracts.ts` para DTOs TypeScript respaldados por OpenAPI/Postman. |
| Postman | Mantener `src/data/postmanCollection.json` como catálogo operativo de endpoints. |
| OpenAPI | Mantener `api-definition/RagPymes-v1.json` como contrato formal local. |

Reglas obligatorias:

- No modificar `../rag-pymes-backend/` desde este workspace.
- Antes de implementar cambios API-facing, revisar el backend o los artefactos OpenAPI/Postman.
- Los flujos guiados deben usar la capa API tipada.
- El endpoint explorer puede ejecutar operaciones avanzadas, pero debe reutilizar la configuración global de URL, token y variables compartidas.
- Las subidas de documentos deben usar `FormData` real y no fijar manualmente la cabecera `Content-Type` multipart.
- Los filtros de búsqueda y respuesta deben tratarse como JSON opcional de acuerdo con el contrato vigente.

## 10. Configuración de entorno

| Variable | Obligatoria | Ejemplo | Descripción |
| --- | --- | --- | --- |
| `VITE_RAGPYMES_API_BASE_URL` | No | `http://localhost:5088` | URL base por defecto para conectar con la API RagPymes. |
| `VITE_RAGPYMES_API_TIMEOUT_MS` | No | `30000` | Timeout de llamadas HTTP en milisegundos. |

Convenciones:

- No almacenar secretos reales en ficheros versionados.
- No pegar tokens de producción en capturas, logs, issues o comentarios.
- El Bearer token usado por la SPA debe ser de entornos no productivos.

## 11. Convenciones de pruebas

- Usar Vitest como runner de pruebas.
- Usar React Testing Library para probar comportamiento visible, no detalles internos de implementación.
- Nombrar tests como `*.test.ts` o `*.test.tsx`.
- Colocar tests junto a la unidad probada o bajo `src/__tests__/`.
- Cubrir, como mínimo, comportamiento visible, mapeo API, validaciones y estados de error.
- Ejecutar `npm run build` antes de cerrar cambios que afecten código de aplicación.
- Ejecutar `npm test` cuando existan pruebas relevantes para el cambio.

## 12. Convenciones de documentación

- Toda la documentación de la SPA debe vivir bajo `docs/`, salvo el `README.md` raíz y la documentación constitucional bajo `sdd/constitution/`.
- Debe existir exactamente un fichero llamado `README.md`, ubicado en la raíz.
- No crear `docs/README.md` ni README adicionales por paquete.
- `README.md` debe actuar como índice breve del proyecto.
- `docs/api-testing.md` debe concentrar guías operativas, flujos manuales, refresh de artefactos y smoke tests.
- `docs/spa-demo-test.md` debe mantener el plan de evolución de la SPA.
- `AGENTS.md` queda reservado para instrucciones de contribución y agentes.

## 13. Convenciones de seguridad

- No usar datos reales sensibles en pruebas manuales.
- No registrar documentos completos, tokens, prompts sensibles ni secretos.
- Mostrar errores de API de forma útil, pero sin exponer credenciales.
- Tratar `401` y `403` como señales de autenticación o permisos, no como errores genéricos.
- Usar tokens no productivos y de mínimo alcance posible.
- Validar manualmente CORS, conectividad y permisos cuando se cambie la configuración de backend o frontend.

## 14. Convenciones de control de cambios

- Usar commits concisos con formato Conventional Commits mientras no exista otra convención oficial.
- Ejemplos válidos: `feat: add tenant dashboard`, `fix: handle empty API response`.
- Las pull requests deben incluir resumen, evidencia de pruebas y capturas o grabaciones cuando cambie la UI.
- No mezclar refactors no relacionados con cambios funcionales o documentales pequeños.

## 15. Limitaciones y pendientes

| Elemento | Estado | Recomendación |
| --- | --- | --- |
| Versión de Node.js | No fijada en los ficheros inspeccionados. | Definir `.nvmrc`, `volta`, `engines` o una guía equivalente si el equipo necesita reproducibilidad estricta. |
| Configuración de ESLint | Script y dependencias presentes; configuración versionada no detectada. | Añadir configuración ESLint antes de exigir `npm run lint` como validación obligatoria. |
| Prettier | No declarado en `package.json`. | Añadirlo solo si el equipo decide automatizar formato. |
| Tests existentes | No se ha inventariado cobertura en este documento. | Mantener pruebas enfocadas cuando se modifiquen flujos, API o errores. |
| Backend | Fuera del workspace editable. | Consultarlo como fuente de verdad, pero no modificarlo desde este proyecto. |

## 16. Ficheros relacionados

| Fichero | Uso |
| --- | --- |
| `README.md` | Resumen del proyecto y enlaces de documentación. |
| `AGENTS.md` | Reglas de estructura, comandos, backend, documentación y convenciones. |
| `docs/api-testing.md` | Uso operativo de la SPA y flujos de prueba. |
| `docs/spa-demo-test.md` | Plan de ejecución de la demo guiada. |
| `package.json` | Scripts y dependencias declaradas. |
| `vite.config.ts` | Configuración de Vite y puerto local. |
| `tsconfig.json` | Referencias TypeScript del workspace. |
| `tsconfig.app.json` | Configuración TypeScript para `src/`. |
| `tsconfig.node.json` | Configuración TypeScript para herramientas Node. |
| `src/api/` | Capa API tipada de RagPymes. |
| `src/features/ragPymesApiDemo/` | Experiencia funcional de pruebas API. |
| `api-definition/RagPymes-v1.json` | Contrato OpenAPI local. |
| `src/data/postmanCollection.json` | Colección Postman local consumida por el explorador. |

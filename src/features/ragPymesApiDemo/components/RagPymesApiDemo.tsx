import { SectionCard } from '../../../components/shared/SectionCard';
import type { ApiConnectionSettings, UpdateApiConnectionSettings } from '../../../types/connection';
import type { SharedDemoVariables, UpdateSharedDemoVariables } from '../types/demoVariables';
import { EndpointExplorer } from './EndpointExplorer';
import { FeatureExplainerCards } from './FeatureExplainerCards';

interface RagPymesApiDemoProps {
  connectionSettings: ApiConnectionSettings;
  onConnectionSettingsChange: UpdateApiConnectionSettings;
  updateVariables: UpdateSharedDemoVariables;
  variables: SharedDemoVariables;
}

const advancedFeatureHelp = {
  howTo: {
    hint: 'Úsalo para endpoints no cubiertos por paneles guiados, como grants de KnowledgeBase, rutas /api/v1/platform/... o cualquier operación que necesite inspección cruda.',
    steps: [
      'Revisa la configuración global de URL base y Bearer token antes de enviar la petición.',
      'Selecciona un endpoint del catálogo Postman y lee su descripción junto al contrato OpenAPI.',
      'Rellena path params, query params, JSON body o campos multipart según indique el contrato.',
      'Ejecuta la petición y contrasta método, URL final, status, headers, body y ProblemDetails.',
    ],
  },
  what: {
    description: 'Expone el catálogo completo importado desde Postman y enriquecido con OpenAPI para probar manualmente cualquier endpoint real del backend RagPymes.',
    fields: ['Reutiliza API base URL y Bearer token globales.', 'Puede rellenar variables compartidas como tenantId, membershipId, invitationId, invitationToken, knowledgeBaseId, documentId e ingestionRunId.', 'Soporta JSON, path params, query params y multipart/form-data cuando el endpoint lo define.', 'No sustituye los flujos guiados: sirve para operaciones avanzadas, comparación de contrato y diagnóstico.'],
    response: ['Request ejecutado con URL final, método y payload enviado.', 'Status HTTP, headers y body de respuesta.', 'ProblemDetails con errorCode cuando el backend rechaza la operación.', 'Evidencia para detectar diferencias entre Postman, OpenAPI, capa tipada y comportamiento real de la API.'],
  },
};

export function RagPymesApiDemo({
  connectionSettings,
  onConnectionSettingsChange,
  updateVariables,
  variables,
}: RagPymesApiDemoProps) {
  return (
    <SectionCard
      eyebrow="Avanzado"
      title="Explorador completo de endpoints"
      description="Herramienta avanzada para inspeccionar todos los endpoints Postman, contrato OpenAPI, payloads y respuestas sin sustituir los flujos guiados."
    >
      <FeatureExplainerCards ariaLabel="Como probar y que hace el explorador avanzado" {...advancedFeatureHelp} />
      <EndpointExplorer
        connectionSettings={connectionSettings}
        onConnectionSettingsChange={onConnectionSettingsChange}
        updateVariables={updateVariables}
        variables={variables}
      />
    </SectionCard>
  );
}

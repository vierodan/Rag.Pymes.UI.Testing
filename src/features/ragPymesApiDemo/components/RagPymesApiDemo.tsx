import { SectionCard } from '../../../components/shared/SectionCard';
import type { ApiConnectionSettings, UpdateApiConnectionSettings } from '../../../types/connection';
import type { SharedDemoVariables, UpdateSharedDemoVariables } from '../types/demoVariables';
import { EndpointExplorer } from './EndpointExplorer';

interface RagPymesApiDemoProps {
  connectionSettings: ApiConnectionSettings;
  onConnectionSettingsChange: UpdateApiConnectionSettings;
  updateVariables: UpdateSharedDemoVariables;
  variables: SharedDemoVariables;
}

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
      <EndpointExplorer
        connectionSettings={connectionSettings}
        onConnectionSettingsChange={onConnectionSettingsChange}
        updateVariables={updateVariables}
        variables={variables}
      />
    </SectionCard>
  );
}

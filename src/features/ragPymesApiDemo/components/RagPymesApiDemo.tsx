import { SectionCard } from '../../../components/shared/SectionCard';
import { EndpointExplorer } from './EndpointExplorer';

export function RagPymesApiDemo() {
  return (
    <SectionCard
      eyebrow="Avanzado"
      title="Explorador completo de endpoints"
      description="La herramienta conserva todos los endpoints documentados en Postman y los enriquece con el contrato formal de OpenAPI."
    >
      <EndpointExplorer />
    </SectionCard>
  );
}

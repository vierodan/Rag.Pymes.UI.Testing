import { useEffect, useState } from 'react';
import apiDefinition from '../../api-definition/RagPymes-v1.json';
import { apiConfig, setApiBaseUrl } from '../api/apiConfig';
import { setAccessTokenGetter } from '../api/httpClient';
import { SectionCard } from '../components/shared/SectionCard';
import postmanCollection from '../data/postmanCollection.json';
import { AccessManagementPanel } from '../features/ragPymesApiDemo/components/AccessManagementPanel';
import { ConnectionHealthPanel } from '../features/ragPymesApiDemo/components/ConnectionHealthPanel';
import { KnowledgePanel } from '../features/ragPymesApiDemo/components/KnowledgePanel';
import { RagPymesApiDemo } from '../features/ragPymesApiDemo/components/RagPymesApiDemo';
import { initialSharedDemoVariables, type SharedDemoVariables } from '../features/ragPymesApiDemo/types/demoVariables';
import { buildOpenApiContractIndex } from '../lib/openapi';
import { buildCatalog } from '../lib/postman';
import type { ApiConnectionSettings, ConnectionSummary } from '../types/connection';
import type { OpenApiDocument } from '../types/openapi';
import styles from './HomePage.module.css';

const apiDocument = apiDefinition as OpenApiDocument;
const catalog = buildCatalog(postmanCollection);
const contractIndex = buildOpenApiContractIndex(apiDocument);

const flowCards = [
  {
    detail: 'Comprueba disponibilidad, readiness y contrato antes de lanzar pruebas protegidas.',
    metric: '3 checks',
    title: 'Health y conexion',
  },
  {
    detail: 'Registra tenants, provisiona entornos, invita usuarios y valida memberships.',
    metric: 'IAM',
    title: 'Access Management',
  },
  {
    detail: 'Crea knowledge bases, sube documentos, revisa ingestion y ejecuta reindex.',
    metric: 'RAG',
    title: 'Knowledge pipeline',
  },
  {
    detail: 'Ejecuta busquedas y respuestas fundamentadas con citas sobre documentos indexados.',
    metric: 'QA',
    title: 'Search y answers',
  },
];

const workbenchSteps = [
  'Configurar base URL y token Bearer si el endpoint lo requiere.',
  'Elegir un flujo guiado o abrir el explorador avanzado.',
  'Ejecutar request, revisar payload, estado HTTP y ProblemDetails.',
];

interface HomePageProps {
  onConnectionChange: (summary: ConnectionSummary) => void;
}

export function HomePage({ onConnectionChange }: HomePageProps) {
  const [sharedVariables, setSharedVariables] = useState<SharedDemoVariables>(initialSharedDemoVariables);
  const [connectionSettings, setConnectionSettings] = useState<ApiConnectionSettings>({
    baseUrl: apiConfig.baseUrl,
    bearerToken: '',
  });

  useEffect(() => {
    setApiBaseUrl(connectionSettings.baseUrl);
    setAccessTokenGetter(() => connectionSettings.bearerToken.trim() || undefined);
  }, [connectionSettings.baseUrl, connectionSettings.bearerToken]);

  function updateSharedVariables(updates: Partial<SharedDemoVariables>) {
    setSharedVariables((current) => ({ ...current, ...updates }));
  }

  function updateConnectionSettings(updates: Partial<ApiConnectionSettings>) {
    setConnectionSettings((current) => ({ ...current, ...updates }));
  }

  const configItems = [
    {
      detail: connectionSettings.baseUrl,
      label: 'API base URL',
      state: connectionSettings.baseUrl.trim() ? 'Configurada' : 'Pendiente',
    },
    {
      detail: `${apiDocument.info.title} ${apiDocument.info.version} - ${contractIndex.size} endpoints`,
      label: 'Contrato OpenAPI',
      state: 'Cargado',
    },
    {
      detail: `${catalog.name} - ${catalog.endpoints.length} endpoints`,
      label: 'Coleccion Postman',
      state: 'Sincronizada',
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroPanel}>
          <p className={styles.eyebrow}>RagPymes API Testing SPA</p>
          <h2 className={styles.heroTitle}>Consola operativa para validar la API de RagPymes.</h2>
          <p className={styles.heroLead}>
            Un workspace React + Vite para probar contratos, payloads y respuestas reales sin tocar el backend.
          </p>
          <div className={styles.heroActions} aria-label="Acciones principales">
            <a className={styles.primaryAction} href="#endpoint-explorer">
              Abrir explorador
            </a>
            <a className={styles.secondaryAction} href="#configuration">
              Revisar configuracion
            </a>
          </div>
        </div>

        <div className={styles.heroStatus} aria-label="Resumen del entorno">
          <div className={styles.signal}>
            <span className={styles.signalValue}>{connectionSettings.baseUrl.trim() ? 'Lista' : 'Pendiente'}</span>
            <span className={styles.signalLabel}>configuracion API</span>
          </div>
          <div className={styles.signal}>
            <span className={styles.signalValue}>{catalog.endpoints.length}</span>
            <span className={styles.signalLabel}>endpoints Postman</span>
          </div>
          <div className={styles.signal}>
            <span className={styles.signalValue}>{contractIndex.size}</span>
            <span className={styles.signalLabel}>endpoints OpenAPI</span>
          </div>
        </div>
      </section>

      <SectionCard
        eyebrow="Conexion"
        title="Health checks"
        description="Configura la API base URL, anade un Bearer token si lo necesitas y valida la disponibilidad del backend."
      >
        <ConnectionHealthPanel
          connectionSettings={connectionSettings}
          onConnectionChange={onConnectionChange}
          onConnectionSettingsChange={updateConnectionSettings}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Access Management"
        title="Flujos guiados de tenants, invitaciones y membresias"
        description="Ejecuta operaciones frecuentes con formularios compactos, valores Postman y captura automatica de IDs reutilizables."
      >
        <AccessManagementPanel updateVariables={updateSharedVariables} variables={sharedVariables} />
      </SectionCard>

      <SectionCard
        eyebrow="Knowledge"
        title="Flujos guiados RAG: bases, documentos, ingestion y retrieval"
        description="Crea knowledge bases, sube documentos con FormData real, sigue ingestion y ejecuta busquedas o respuestas con citas."
      >
        <KnowledgePanel updateVariables={updateSharedVariables} variables={sharedVariables} />
      </SectionCard>

      <section className={styles.dashboardGrid} id="configuration">
        <SectionCard
          eyebrow="Entorno"
          title="Estado de configuracion"
          description="La app muestra desde donde ejecutara las pruebas y que artefactos locales usa como contrato."
        >
          <div className={styles.configList}>
            {configItems.map((item) => (
              <article className={styles.configItem} key={item.label}>
                <div>
                  <p className={styles.itemLabel}>{item.label}</p>
                  <p className={styles.itemDetail}>{item.detail}</p>
                </div>
                <span className={styles.itemState}>{item.state}</span>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Uso"
          title="Modo de trabajo"
          description="Pensado para validar endpoints, preparar demos y capturar errores de contrato rapidamente."
        >
          <ol className={styles.stepList}>
            {workbenchSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </SectionCard>
      </section>

      <SectionCard
        eyebrow="Flujos"
        title="Superficie funcional"
        description="Los recorridos principales de RagPymes quedan visibles antes de entrar al detalle endpoint por endpoint."
      >
        <div className={styles.flowGrid}>
          {flowCards.map((flow) => (
            <article className={styles.flowCard} key={flow.title}>
              <span className={styles.flowMetric}>{flow.metric}</span>
              <h3>{flow.title}</h3>
              <p>{flow.detail}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <div id="endpoint-explorer">
        <RagPymesApiDemo
          connectionSettings={connectionSettings}
          onConnectionSettingsChange={updateConnectionSettings}
          updateVariables={updateSharedVariables}
          variables={sharedVariables}
        />
      </div>
    </div>
  );
}

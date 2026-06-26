import apiDefinition from '../../api-definition/RagPymes-v1.json';
import { apiConfig, hasConfiguredApi } from '../api/apiConfig';
import { SectionCard } from '../components/shared/SectionCard';
import postmanCollection from '../data/postmanCollection.json';
import { ConnectionHealthPanel } from '../features/ragPymesApiDemo/components/ConnectionHealthPanel';
import { RagPymesApiDemo } from '../features/ragPymesApiDemo/components/RagPymesApiDemo';
import { buildCatalog } from '../lib/postman';
import type { ConnectionSummary } from '../types/connection';
import type { OpenApiDocument } from '../types/openapi';
import styles from './HomePage.module.css';

const apiDocument = apiDefinition as OpenApiDocument;
const catalog = buildCatalog(postmanCollection);

const configItems = [
  {
    detail: apiConfig.baseUrl,
    label: 'API base URL',
    state: hasConfiguredApi() ? 'Configurada' : 'Pendiente',
  },
  {
    detail: `${apiDocument.info.title} ${apiDocument.info.version} - ${Object.keys(apiDocument.paths).length} paths`,
    label: 'Contrato OpenAPI',
    state: 'Cargado',
  },
  {
    detail: `${catalog.name} - ${catalog.endpoints.length} endpoints`,
    label: 'Coleccion Postman',
    state: 'Sincronizada',
  },
];

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
            <span className={styles.signalValue}>{hasConfiguredApi() ? 'Lista' : 'Pendiente'}</span>
            <span className={styles.signalLabel}>configuracion API</span>
          </div>
          <div className={styles.signal}>
            <span className={styles.signalValue}>{catalog.endpoints.length}</span>
            <span className={styles.signalLabel}>endpoints Postman</span>
          </div>
          <div className={styles.signal}>
            <span className={styles.signalValue}>{Object.keys(apiDocument.paths).length}</span>
            <span className={styles.signalLabel}>paths OpenAPI</span>
          </div>
        </div>
      </section>

      <SectionCard
        eyebrow="Conexion"
        title="Health checks"
        description="Configura la API base URL, anade un Bearer token si lo necesitas y valida la disponibilidad del backend."
      >
        <ConnectionHealthPanel initialBaseUrl={apiConfig.baseUrl} onConnectionChange={onConnectionChange} />
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
        <RagPymesApiDemo />
      </div>
    </div>
  );
}

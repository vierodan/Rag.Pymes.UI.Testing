import { useEffect, useState } from 'react';
import apiDefinition from '../../api-definition/RagPymes-v1.json';
import { apiConfig, setApiBaseUrl } from '../api/apiConfig';
import { setAccessTokenGetter } from '../api/httpClient';
import { SectionCard } from '../components/shared/SectionCard';
import postmanCollection from '../data/postmanCollection.json';
import { AccessManagementPanel } from '../features/ragPymesApiDemo/components/AccessManagementPanel';
import { ConnectionHealthPanel } from '../features/ragPymesApiDemo/components/ConnectionHealthPanel';
import { FeatureExplainerCards } from '../features/ragPymesApiDemo/components/FeatureExplainerCards';
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

const healthFeatureHelp = {
  howTo: {
    hint: 'Estas rutas no requieren autenticación y son la primera comprobación antes de ejecutar cualquier flujo con datos de negocio.',
    steps: [
      'Configura la API base URL del host RagPymes.Api, por ejemplo http://localhost:5088.',
      'Ejecuta primero GET /health/live para confirmar que el proceso HTTP responde.',
      'Ejecuta GET /health/ready para comprobar si dependencias y configuración crítica están listas.',
      'Ejecuta GET /health para revisar el estado agregado del host y usarlo como smoke test rápido.',
    ],
  },
  what: {
    description: 'Valida que la SPA habla con el backend correcto y separa tres problemas distintos: proceso vivo, API preparada y estado agregado del host.',
    fields: ['API base URL debe ser una URL absoluta http:// o https://.', 'No necesita body, parámetros ni Bearer token.', 'El token global puede configurarse aquí para reutilizarlo después en endpoints protegidos.'],
    response: ['200 OK con estado de liveness, readiness o health agregado.', 'Latencia medida por la SPA para detectar lentitud básica.', 'ProblemDetails o error normalizado si la URL es inválida, el backend no responde o CORS bloquea la llamada.'],
  },
};

const accessFeatureHelp = {
  howTo: {
    hint: 'AccessManagement es la frontera funcional de tenant y autorización: responde quién puede hacer qué, sobre qué tenant y sobre qué recurso.',
    steps: [
      'Configura un Bearer token válido o usa un entorno Development con autenticación desactivada de forma controlada.',
      'Crea un tenant con registro self-service o provisioning técnico y captura tenantId.',
      'Gestiona invitaciones, aceptación y memberships usando solo roles documentados.',
      'Revisa siempre ProblemDetails, especialmente errorCode, cuando la API devuelva 400, 403, 409 o 429.',
    ],
  },
  what: {
    description: 'Permite probar la administración SaaS de RagPymes: alta de empresas, visibilidad de tenants, invitaciones por email, membresías humanas y cambios de rol.',
    fields: ['tenantId, invitationId, invitationToken y membershipId son variables compartidas entre acciones.', 'Roles de tenant válidos: TenantOwner, TenantAdmin y TenantMember.', 'El actor humano se resuelve desde claims firmados; no se envían issuer, subject, actorId ni roles en requests self-service.'],
    response: ['tenant y ownerMembership al registrar o provisionar.', 'invitations, invitationToken y membership al crear o aceptar invitaciones.', 'memberships con subjectId, role, status, fechas y version.', 'ProblemDetails con extensions.errorCode para validación, permisos, conflictos y cuotas.'],
  },
};

const knowledgeFeatureHelp = {
  howTo: {
    hint: 'Knowledge depende de AccessManagement: el tenant debe estar activo y el actor necesita membership o grant válido para cada operación.',
    steps: [
      'Confirma tenantId y un actor autorizado con permisos Knowledge.Read o Knowledge.Write según la operación.',
      'Crea o selecciona una knowledge base visible para el actor y captura knowledgeBaseId.',
      'Sube un documento permitido y espera a que el Worker procese la ingestion antes de buscar o preguntar.',
      'Ejecuta search o answer con preguntas no sensibles y revisa resultados, citas, metadata y abstenciones.',
    ],
  },
  what: {
    description: 'Valida el ciclo RAG documental: crear bases de conocimiento, subir documentos, procesarlos de forma asíncrona, buscar chunks relevantes y generar respuestas fundamentadas con citas.',
    fields: ['tenantId está en todas las rutas públicas de Knowledge y no se infiere desde el usuario.', 'knowledgeBaseId, documentId e ingestionRunId deben pertenecer al tenant de la ruta.', 'filters es opcional, debe ser diccionario string-string y no puede incluir tenantId ni knowledgeBaseId.', 'Usa documentos sintéticos; no pegues contenido sensible, tokens ni prompts privados en logs o capturas.'],
    response: ['knowledgeBase con tenantId, id, name, description, createdAt, isArchived y archivedAt.', 'document e ingestionRun con status, fechas, errorCode, errorMessage y modelo de embeddings cuando aplique.', 'results con documentId, chunkId, content, score y metadata.', 'answer con citations, model y metadata; puede abstenerse si la evidencia no es suficiente.'],
  },
};

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
        <FeatureExplainerCards ariaLabel="Como probar y que hace la feature de health checks" {...healthFeatureHelp} />
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
        <FeatureExplainerCards ariaLabel="Como probar y que hace la feature de Access Management" {...accessFeatureHelp} />
        <AccessManagementPanel updateVariables={updateSharedVariables} variables={sharedVariables} />
      </SectionCard>

      <SectionCard
        eyebrow="Knowledge"
        title="Flujos guiados RAG: bases, documentos, ingestion y retrieval"
        description="Crea knowledge bases, sube documentos con FormData real, sigue ingestion y ejecuta busquedas o respuestas con citas."
      >
        <FeatureExplainerCards ariaLabel="Como probar y que hace la feature Knowledge" {...knowledgeFeatureHelp} />
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

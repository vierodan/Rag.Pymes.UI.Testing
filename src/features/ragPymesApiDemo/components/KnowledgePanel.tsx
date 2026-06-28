import { useState, type ReactNode } from 'react';
import { getLastResponseStatus } from '../../../api/httpClient';
import { ragPymesApi } from '../../../api/ragPymesApi';
import type {
  CreateKnowledgeBaseRequest,
  GenerateKnowledgeAnswerRequest,
  KnowledgeSearchRequest,
} from '../../../api/contracts';
import type { SharedDemoVariables, UpdateSharedDemoVariables } from '../types/demoVariables';
import { normalizeApiError, type NormalizedApiError } from './apiResultUtils';
import { ApiActionButton } from './ApiActionButton';
import { EndpointStepTitle } from './EndpointStepTitle';
import { FeatureExplainerCards, type FeatureExplainerCardsProps } from './FeatureExplainerCards';
import { OperationResultCard } from './OperationResultCard';
import styles from './KnowledgePanel.module.css';

type HttpMethod = 'GET' | 'POST' | 'DELETE';

interface ActionMeta {
  endpoint: string;
  method: HttpMethod;
  operationId: string;
}

interface ActionResult {
  captured: Partial<SharedDemoVariables>;
  error?: NormalizedApiError;
  latencyMs: number;
  payload?: unknown;
  status: number | null;
  state: 'success' | 'error';
}

interface KnowledgePanelProps {
  updateVariables: UpdateSharedDemoVariables;
  variables: SharedDemoVariables;
}

const actions = {
  createKnowledgeBase: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases',
    method: 'POST',
    operationId: 'CreateKnowledgeBase',
  },
  deleteKnowledgeDocument: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/documents/{documentId}',
    method: 'DELETE',
    operationId: 'DeleteKnowledgeDocument',
  },
  generateKnowledgeAnswer: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/answers',
    method: 'POST',
    operationId: 'GenerateKnowledgeAnswer',
  },
  getIngestionRun: {
    endpoint:
      '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/documents/{documentId}/ingestion-runs/{ingestionRunId}',
    method: 'GET',
    operationId: 'GetIngestionRun',
  },
  getKnowledgeBase: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}',
    method: 'GET',
    operationId: 'GetKnowledgeBase',
  },
  getKnowledgeDocument: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/documents/{documentId}',
    method: 'GET',
    operationId: 'GetKnowledgeDocument',
  },
  listDocumentIngestionRuns: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/documents/{documentId}/ingestion-runs',
    method: 'GET',
    operationId: 'ListDocumentIngestionRuns',
  },
  listKnowledgeBases: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases',
    method: 'GET',
    operationId: 'ListKnowledgeBases',
  },
  reindexKnowledgeDocument: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/documents/{documentId}/reindexing-runs',
    method: 'POST',
    operationId: 'ReindexKnowledgeDocument',
  },
  searchKnowledge: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/searches',
    method: 'POST',
    operationId: 'SearchKnowledge',
  },
  uploadKnowledgeDocument: {
    endpoint: '/api/v1/tenants/{tenantId}/knowledge-bases/{knowledgeBaseId}/documents',
    method: 'POST',
    operationId: 'UploadKnowledgeDocument',
  },
} satisfies Record<string, ActionMeta>;

const initialKnowledgeBaseForm = {
  description: 'Departamento financiero',
  name: 'Financiero',
};

const initialSearchForm = {
  filters: '',
  query: 'Cual es el horario de atencion los viernes?',
  topK: '3',
};

const initialAnswerForm = {
  filters: '',
  question: 'Compara el contrato basico y el contrato premium.',
  topK: '3',
};

const knowledgeSectionHelp = {
  knowledgeBases: {
    ariaLabel: 'Como probar y que hace Knowledge bases',
    howTo: {
      hint: 'Una KnowledgeBase es el contenedor lógico de documentos de un tenant; no administra membresías ni grants, eso pertenece a AccessManagement.',
      steps: [
        'Confirma que tenantId pertenece a un tenant activo y que el actor tiene permiso Knowledge.Write para crear o Knowledge.Read para listar y consultar.',
        'Crea una knowledge base con name obligatorio y description opcional.',
        'Ejecuta ListKnowledgeBases para ver solo las bases visibles según el alcance resuelto por AccessManagement.',
        'Ejecuta GetKnowledgeBase con knowledgeBaseId para validar que el recurso pertenece al tenant de la ruta.',
      ],
    },
    what: {
      description: 'Crea y consulta espacios de conocimiento donde se agrupan documentos de un tenant para retrieval y respuestas RAG.',
      fields: ['POST /knowledge-bases: name obligatorio, máximo 120 caracteres.', 'description es opcional y no puede superar 1000 caracteres.', 'tenantId se recibe por ruta y es obligatorio; Knowledge no lo infiere desde el usuario.', 'knowledgeBaseId no puede ser Guid.Empty en consultas por id.'],
      response: ['201 Created con knowledgeBase y cabecera Location al crear.', 'knowledgeBase incluye tenantId, id, name, description, createdAt, isArchived y archivedAt.', 'List devuelve solo bases visibles para el actor según AccessManagement.', '404 si la base no existe o no pertenece al tenant; 403 si AccessManagement deniega.'],
    },
  },
  documents: {
    ariaLabel: 'Como probar y que hace Documents',
    howTo: {
      hint: 'La subida no procesa todo el documento en la petición HTTP: registra el documento, crea un ingestion run y devuelve 202 Accepted.',
      steps: [
        'Confirma tenantId y knowledgeBaseId y usa un actor con permiso document.upload para subir.',
        'Selecciona un archivo sintético .md, .markdown, .pdf o .txt con content type permitido.',
        'Sube el archivo y guarda documentId e ingestionRunId devueltos.',
        'Consulta el documento para ver metadata y latestIngestionRun; elimina solo en entornos de prueba controlados.',
      ],
    },
    what: {
      description: 'Gestiona archivos dentro de una KnowledgeBase: subida multipart, consulta de metadata y eliminación lógica del documento y sus vectores.',
      fields: ['file es obligatorio; el nombre de archivo se normaliza con Path.GetFileName.', 'Extensiones permitidas por defecto: .markdown, .md, .pdf y .txt.', 'Content types permitidos por defecto: application/pdf, text/markdown, text/x-markdown y text/plain.', 'El tamaño debe ser mayor que cero y respetar el menor límite entre configuración de entorno y plan del tenant.', 'documentId no puede ser Guid.Empty al consultar o eliminar.'],
      rules: ['La UI usa FormData real y deja que el navegador fije multipart boundaries y Content-Type.', 'GET document no devuelve el contenido completo del documento, solo metadata y latestIngestionRun.', 'DELETE es eliminación lógica: el documento deja de participar en búsquedas, pero metadata, chunks e ingestion runs se conservan para trazabilidad.', 'DELETE devuelve 409 si el documento está en Processing.'],
      response: ['Upload devuelve 202 Accepted con document en estado Uploaded e ingestionRun en estado Pending.', 'Get devuelve document y latestIngestionRun, que puede ser null si no hay ingestas asociadas.', 'Delete devuelve 204 No Content.', 'Errores de validación incluyen archivo vacío, extensión inválida, content type inválido, tamaño excesivo o permisos insuficientes.'],
    },
  },
  ingestion: {
    ariaLabel: 'Como probar y que hace Ingestion',
    howTo: {
      hint: 'La ingesta real la ejecuta RagPymes.Worker en segundo plano; la API solo crea o consulta ejecuciones.',
      steps: [
        'Después de subir un documento, usa ListDocumentIngestionRuns para ver el historial ordenado por fecha de creación descendente.',
        'Usa GetIngestionRun con ingestionRunId para diagnosticar una ejecución concreta.',
        'Lanza ReindexKnowledgeDocument cuando necesites reconstruir chunks y vectores de un documento existente.',
        'Revisa status, errorCode, errorMessage, embeddingProvider, embeddingModel y embeddingDimensions antes de buscar o preguntar.',
      ],
    },
    what: {
      description: 'Observa y controla el procesamiento asíncrono de documentos: extracción de texto, chunking, embeddings y reemplazo de vectores en Qdrant.',
      fields: ['tenantId, knowledgeBaseId, documentId e ingestionRunId se reciben por ruta y deben pertenecer al mismo tenant.', 'Reindex no tiene body y crea un nuevo ingestionRun Pending.', 'La operación requiere permisos de lectura para consultar y permiso ingestion.reindex para reindexar.'],
      rules: ['Estados de documento: Uploaded, Processing, Processed, Failed y Deleted.', 'Estados de ingestion run: Pending, Running, Completed, Failed, Cancelling y Cancelled.', 'La cola actual de ingesta se basa en PostgreSQL por polling del Worker, no en el broker de integración.', 'No asumas que un documento participa en búsquedas hasta verlo Processed o con ingestion Completed.'],
      response: ['List devuelve ingestionRuns ordenadas por creación descendente.', 'Get devuelve status, fechas, errorCode/errorMessage y datos de embeddings.', 'Reindex devuelve 202 Accepted con document e ingestionRun nuevo.', '404 si documentId o ingestionRunId no existen o no pertenecen al tenant; 403 si AccessManagement deniega.'],
    },
  },
  retrieval: {
    ariaLabel: 'Como probar y que hace Retrieval y RAG',
    howTo: {
      hint: 'Search y Answer siempre se acotan por tenantId y knowledgeBaseId; los filtros de tenant y base los impone el backend, no el usuario.',
      steps: [
        'Confirma que existe una knowledge base con documentos procesados.',
        'Ejecuta Search con query obligatoria, topK positivo y filters opcional como JSON string-string.',
        'Ejecuta Answer con question obligatoria para generar una respuesta fundamentada con citas.',
        'Si no aparecen resultados, revisa ingestion runs, estado del documento y filtros aplicados.',
      ],
    },
    what: {
      description: 'Ejecuta recuperación documental y generación RAG: Search devuelve fragmentos relevantes; Answer genera una respuesta basada en contexto recuperado y citas verificables.',
      fields: ['Search usa query obligatorio; Answer usa question obligatorio.', 'topK debe ser mayor que cero y no superar el límite MaxSearchTopK o MaxAnswerTopK del plan efectivo.', 'filters es opcional, con claves y valores string; no puede incluir tenantId ni knowledgeBaseId.', 'query/question no pueden superar MaxQuestionLength del plan efectivo.'],
      rules: ['Search usa retrieval rápido con Qdrant, PostgreSQL lexical y fusión RRF.', 'Answer puede aplicar política adaptativa, multi-query como fallback, reranking, context packing y puerta de confianza.', 'Si no hay contexto, Answer puede devolver error funcional Knowledge.Answer.NoContext.', 'Si hay fuente cercana pero evidencia insuficiente, puede devolver 200 OK con metadata abstained=true y cita más cercana.'],
      response: ['Search devuelve results con tenantId, documentId, documentFileName, chunkId, content, score y metadata.', 'Answer devuelve answer, citations, model y metadata opcional.', 'Las citas incluyen referenceNumber, documentId, documentFileName, chunkId, score, snippet y metadata.', 'Errores posibles: MissingActor 401, Authorization.Denied 403, ReservedFilter 400, TopKTooLarge 400 o errores de citas inválidas.'],
    },
  },
} satisfies Record<string, FeatureExplainerCardsProps>;

export function KnowledgePanel({ updateVariables, variables }: KnowledgePanelProps) {
  const [knowledgeBaseForm, setKnowledgeBaseForm] = useState(initialKnowledgeBaseForm);
  const [searchForm, setSearchForm] = useState(initialSearchForm);
  const [answerForm, setAnswerForm] = useState(initialAnswerForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});

  async function runAction(meta: ActionMeta, action: () => Promise<unknown>) {
    setActiveOperationId(meta.operationId);
    const startedAt = performance.now();

    try {
      const payload = await action();
      const latencyMs = Math.round(performance.now() - startedAt);
      const captured = captureKnowledgeVariables(payload);
      const status = getLastResponseStatus();

      if (Object.keys(captured).length > 0) {
        updateVariables(captured);
      }

      setResults((current) => ({
        ...current,
        [meta.operationId]: {
        captured,
        latencyMs,
        payload,
        status,
        state: 'success',
        },
      }));
    } catch (error) {
      const normalizedError = normalizeApiError(
        error,
        'Comprueba tenantId, knowledgeBaseId, documentId, ingestionRunId, token Bearer y permisos Knowledge.',
      );

      setResults((current) => ({
        ...current,
        [meta.operationId]: {
        captured: {},
        error: normalizedError,
        latencyMs: Math.round(performance.now() - startedAt),
        payload: normalizedError.problem,
        status: normalizedError.status ?? null,
        state: 'error',
        },
      }));
    } finally {
      setActiveOperationId(null);
    }
  }

  function clearResult(operationId: string) {
    setResults((current) => {
      const { [operationId]: _removed, ...remaining } = current;
      return remaining;
    });
  }

  return (
    <div className={styles.panel}>
      <section className={styles.variablesPanel} aria-label="Variables Knowledge compartidas">
        <div>
          <h3>Variables Knowledge</h3>
          <p>Se comparten con Access Management y se actualizan al capturar IDs en las respuestas.</p>
        </div>
        <div className={styles.variableGrid}>
          <TextField label="tenantId" onChange={(tenantId) => updateVariables({ tenantId })} value={variables.tenantId} />
          <TextField
            label="knowledgeBaseId"
            onChange={(knowledgeBaseId) => updateVariables({ knowledgeBaseId })}
            value={variables.knowledgeBaseId}
          />
          <TextField
            label="documentId"
            onChange={(documentId) => updateVariables({ documentId })}
            value={variables.documentId}
          />
          <TextField
            label="ingestionRunId"
            onChange={(ingestionRunId) => updateVariables({ ingestionRunId })}
            value={variables.ingestionRunId}
          />
        </div>
      </section>

      <div className={styles.flowGrid}>
        <FlowPanel help={knowledgeSectionHelp.knowledgeBases} title="Knowledge bases">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Crea una base dentro del tenant usando los ejemplos Postman."
            meta={actions.createKnowledgeBase}
            onClearResult={clearResult}
            onRun={() =>
              runAction(actions.createKnowledgeBase, () =>
                ragPymesApi.knowledge.createKnowledgeBase(
                  variables.tenantId,
                  toCreateKnowledgeBaseRequest(knowledgeBaseForm),
                ),
              )
            }
            title="Create knowledge base"
            result={results[actions.createKnowledgeBase.operationId]}
          >
            <div className={styles.formGrid}>
              <TextField
                label="name"
                onChange={(name) => setKnowledgeBaseForm((current) => ({ ...current, name }))}
                value={knowledgeBaseForm.name}
              />
              <TextField
                label="description"
                onChange={(description) => setKnowledgeBaseForm((current) => ({ ...current, description }))}
                value={knowledgeBaseForm.description}
              />
            </div>
          </ActionBlock>
          <div className={styles.buttonRow}>
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Lista las knowledge bases visibles para el actor dentro del tenant."
              meta={actions.listKnowledgeBases}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.listKnowledgeBases, () =>
                  ragPymesApi.knowledge.listKnowledgeBases(variables.tenantId),
                )
              }
              result={results[actions.listKnowledgeBases.operationId]}
              title="List knowledge bases"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Obtiene una knowledge base concreta usando tenantId y knowledgeBaseId."
              meta={actions.getKnowledgeBase}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.getKnowledgeBase, () =>
                  ragPymesApi.knowledge.getKnowledgeBase(variables.tenantId, variables.knowledgeBaseId),
                )
              }
              result={results[actions.getKnowledgeBase.operationId]}
              title="Get knowledge base"
            />
          </div>
        </FlowPanel>

        <FlowPanel help={knowledgeSectionHelp.documents} title="Documents">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Sube un archivo real via multipart/form-data. El cliente no fija Content-Type manualmente."
            meta={actions.uploadKnowledgeDocument}
            onClearResult={clearResult}
            onRun={() =>
              runAction(actions.uploadKnowledgeDocument, () => {
                if (!selectedFile) {
                  throw new Error('Selecciona un archivo antes de ejecutar UploadKnowledgeDocument.');
                }

                return ragPymesApi.knowledge.uploadKnowledgeDocument(
                  variables.tenantId,
                  variables.knowledgeBaseId,
                  selectedFile,
                );
              })
            }
            title="Upload document"
            result={results[actions.uploadKnowledgeDocument.operationId]}
          >
            <label className={styles.field}>
              <span>file</span>
              <input onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
            </label>
            {selectedFile ? (
              <p className={styles.fileHint}>
                {selectedFile.name} | {selectedFile.type || 'sin content-type'} | {selectedFile.size} bytes
              </p>
            ) : null}
          </ActionBlock>
          <div className={styles.buttonRow}>
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Consulta metadata del documento y su latestIngestionRun."
              meta={actions.getKnowledgeDocument}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.getKnowledgeDocument, () =>
                  ragPymesApi.knowledge.getKnowledgeDocument(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
              result={results[actions.getKnowledgeDocument.operationId]}
              title="Get document"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Elimina logicamente el documento y retira sus vectores de busqueda."
              meta={actions.deleteKnowledgeDocument}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.deleteKnowledgeDocument, () =>
                  ragPymesApi.knowledge.deleteKnowledgeDocument(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
              result={results[actions.deleteKnowledgeDocument.operationId]}
              title="Delete document"
            />
          </div>
        </FlowPanel>

        <FlowPanel help={knowledgeSectionHelp.ingestion} title="Ingestion">
          <div className={styles.buttonRow}>
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Lista el historico de ingestion runs de un documento."
              meta={actions.listDocumentIngestionRuns}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.listDocumentIngestionRuns, () =>
                  ragPymesApi.knowledge.listDocumentIngestionRuns(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
              result={results[actions.listDocumentIngestionRuns.operationId]}
              title="List ingestion runs"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Consulta una ingestion concreta para diagnosticar estado, tiempos y errores."
              meta={actions.getIngestionRun}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.getIngestionRun, () =>
                  ragPymesApi.knowledge.getIngestionRun(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                    variables.ingestionRunId,
                  ),
                )
              }
              result={results[actions.getIngestionRun.operationId]}
              title="Get ingestion run"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Crea un nuevo ingestion run para reprocesar chunks y vectores del documento."
              meta={actions.reindexKnowledgeDocument}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.reindexKnowledgeDocument, () =>
                  ragPymesApi.knowledge.reindexKnowledgeDocument(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
              result={results[actions.reindexKnowledgeDocument.operationId]}
              title="Reindex document"
            />
          </div>
        </FlowPanel>

        <FlowPanel help={knowledgeSectionHelp.retrieval} title="Retrieval y RAG">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Busqueda semantica. Filters es JSON opcional string-string."
            meta={actions.searchKnowledge}
            onClearResult={clearResult}
            onRun={() =>
              runAction(actions.searchKnowledge, () =>
                ragPymesApi.knowledge.searchKnowledge(
                  variables.tenantId,
                  variables.knowledgeBaseId,
                  toKnowledgeSearchRequest(searchForm),
                ),
              )
            }
            title="Search"
            result={results[actions.searchKnowledge.operationId]}
          >
            <SearchFields
              filters={searchForm.filters}
              onFiltersChange={(filters) => setSearchForm((current) => ({ ...current, filters }))}
              onTopKChange={(topK) => setSearchForm((current) => ({ ...current, topK }))}
              onTextChange={(query) => setSearchForm((current) => ({ ...current, query }))}
              textLabel="query"
              textValue={searchForm.query}
              topK={searchForm.topK}
            />
          </ActionBlock>

          <ActionBlock
            activeOperationId={activeOperationId}
            description="Genera respuesta fundamentada con citas. No se escribe en logs el prompt ni el documento."
            meta={actions.generateKnowledgeAnswer}
            onClearResult={clearResult}
            onRun={() =>
              runAction(actions.generateKnowledgeAnswer, () =>
                ragPymesApi.knowledge.generateKnowledgeAnswer(
                  variables.tenantId,
                  variables.knowledgeBaseId,
                  toGenerateKnowledgeAnswerRequest(answerForm),
                ),
              )
            }
            title="Answer"
            result={results[actions.generateKnowledgeAnswer.operationId]}
          >
            <SearchFields
              filters={answerForm.filters}
              onFiltersChange={(filters) => setAnswerForm((current) => ({ ...current, filters }))}
              onTopKChange={(topK) => setAnswerForm((current) => ({ ...current, topK }))}
              onTextChange={(question) => setAnswerForm((current) => ({ ...current, question }))}
              textLabel="question"
              textValue={answerForm.question}
              topK={answerForm.topK}
            />
          </ActionBlock>
        </FlowPanel>
      </div>
    </div>
  );
}

interface FlowPanelProps {
  children: ReactNode;
  help: FeatureExplainerCardsProps;
  title: string;
}

function FlowPanel({ children, help, title }: FlowPanelProps) {
  return (
    <section className={styles.flowPanel}>
      <h3>{title}</h3>
      <FeatureExplainerCards {...help} />
      {children}
    </section>
  );
}

interface ActionBlockProps {
  activeOperationId: string | null;
  children?: ReactNode;
  description: string;
  meta: ActionMeta;
  onClearResult: (operationId: string) => void;
  onRun: () => void;
  result?: ActionResult;
  title: string;
}

function ActionBlock({
  activeOperationId,
  children,
  description,
  meta,
  onClearResult,
  onRun,
  result,
  title,
}: ActionBlockProps) {
  const resultExtra = result ? (
    <>
      {Object.keys(result.captured).length > 0 ? (
        <div className={styles.capturedBox}>
          <strong>Variables actualizadas</strong>
          <span>{Object.entries(result.captured).map(([key, value]) => `${key}: ${value}`).join(' | ')}</span>
        </div>
      ) : null}
      <KnowledgeResponseSummary payload={result.payload} />
    </>
  ) : undefined;

  return (
    <article className={styles.actionBlock}>
      <ActionHeader description={description} meta={meta} title={title} />
      {children}
      <div className={styles.endpointStepAction}>
        <ApiActionButton
          disabled={activeOperationId !== null}
          method={meta.method}
          onClick={onRun}
          path={meta.endpoint}
        />
      </div>
      <OperationResultCard
        idleMessage={`Ejecuta ${meta.operationId} para ver el resultado de esta operacion.`}
        onClearResult={result ? () => onClearResult(meta.operationId) : undefined}
        result={result ? { ...result, extra: resultExtra } : undefined}
      />
    </article>
  );
}

interface ActionHeaderProps {
  description: string;
  meta: ActionMeta;
  title: string;
}

function ActionHeader({ description, meta, title }: ActionHeaderProps) {
  return (
    <div className={styles.actionHeader}>
      <div>
        <EndpointStepTitle path={meta.endpoint} title={title} />
        <p>{description}</p>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  onChange: (value: string) => void;
  value: string;
}

function TextField({ label, onChange, value }: TextFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

interface SearchFieldsProps {
  filters: string;
  onFiltersChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onTopKChange: (value: string) => void;
  textLabel: string;
  textValue: string;
  topK: string;
}

function SearchFields({
  filters,
  onFiltersChange,
  onTextChange,
  onTopKChange,
  textLabel,
  textValue,
  topK,
}: SearchFieldsProps) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.fieldWide}>
        <span>{textLabel}</span>
        <textarea onChange={(event) => onTextChange(event.target.value)} rows={3} value={textValue} />
      </label>
      <TextField label="topK" onChange={onTopKChange} value={topK} />
      <label className={styles.fieldWide}>
        <span>filters JSON opcional</span>
        <textarea onChange={(event) => onFiltersChange(event.target.value)} placeholder='{"tipo":"contrato"}' rows={3} value={filters} />
      </label>
    </div>
  );
}

function KnowledgeResponseSummary({ payload }: { payload: unknown }) {
  const root = asRecord(payload);
  const results = Array.isArray(root?.results) ? root.results : [];
  const citations = Array.isArray(root?.citations) ? root.citations : [];
  const answer = typeof root?.answer === 'string' ? root.answer : '';
  const metadata = asRecord(root?.metadata);

  if (!answer && results.length === 0 && citations.length === 0 && !metadata) {
    return null;
  }

  return (
    <div className={styles.summaryPanel}>
      {answer ? (
        <section>
          <h4>Answer</h4>
          <p>{answer}</p>
        </section>
      ) : null}

      {results.length > 0 ? (
        <section>
          <h4>Search results</h4>
          <div className={styles.resultCards}>
            {results.map((item, index) => {
              const result = asRecord(item);
              return (
                <article key={`${result?.chunkId ?? index}`}>
                  <strong>{String(result?.documentFileName ?? 'Documento')}</strong>
                  <span>score: {String(result?.score ?? '-')}</span>
                  <p>{String(result?.content ?? '')}</p>
                  <small>{formatMetadata(result?.metadata)}</small>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {citations.length > 0 ? (
        <section>
          <h4>Citations</h4>
          <div className={styles.resultCards}>
            {citations.map((item, index) => {
              const citation = asRecord(item);
              return (
                <article key={`${citation?.chunkId ?? index}`}>
                  <strong>
                    [{String(citation?.referenceNumber ?? index + 1)}] {String(citation?.documentFileName ?? 'Documento')}
                  </strong>
                  <span>score: {String(citation?.score ?? '-')}</span>
                  <p>{String(citation?.snippet ?? '')}</p>
                  <small>{formatMetadata(citation?.metadata)}</small>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {metadata ? (
        <section>
          <h4>Metadata</h4>
          <code>{formatMetadata(metadata)}</code>
        </section>
      ) : null}
    </div>
  );
}

function toCreateKnowledgeBaseRequest(form: typeof initialKnowledgeBaseForm): CreateKnowledgeBaseRequest {
  return {
    description: optionalText(form.description),
    name: form.name,
  };
}

function toKnowledgeSearchRequest(form: typeof initialSearchForm): KnowledgeSearchRequest {
  return {
    filters: parseFilters(form.filters),
    query: form.query,
    topK: optionalTopK(form.topK),
  };
}

function toGenerateKnowledgeAnswerRequest(form: typeof initialAnswerForm): GenerateKnowledgeAnswerRequest {
  return {
    filters: parseFilters(form.filters),
    question: form.question,
    topK: optionalTopK(form.topK),
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalTopK(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('topK debe ser un entero mayor que 0.');
  }

  return parsed;
}

function parseFilters(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = JSON.parse(trimmed) as unknown;
  const record = asRecord(parsed);
  if (!record) {
    throw new Error('filters debe ser un objeto JSON string-string.');
  }

  for (const [key, item] of Object.entries(record)) {
    if (typeof item !== 'string') {
      throw new Error(`filters.${key} debe ser string.`);
    }
  }

  return record as Record<string, string>;
}

function captureKnowledgeVariables(payload: unknown): Partial<SharedDemoVariables> {
  const captured: Partial<SharedDemoVariables> = {};
  const root = asRecord(payload);
  const knowledgeBase = asRecord(root?.knowledgeBase);
  const document = asRecord(root?.document);
  const latestIngestionRun = asRecord(root?.latestIngestionRun);
  const ingestionRun = asRecord(root?.ingestionRun);
  const firstKnowledgeBase = firstRecord(root?.knowledgeBases);
  const firstIngestionRun = firstRecord(root?.ingestionRuns);
  const firstSearchResult = firstRecord(root?.results);

  assignString(captured, 'tenantId', knowledgeBase?.tenantId ?? document?.tenantId ?? ingestionRun?.tenantId ?? firstSearchResult?.tenantId);
  assignString(captured, 'knowledgeBaseId', knowledgeBase?.id ?? document?.knowledgeBaseId ?? firstKnowledgeBase?.id);
  assignString(captured, 'documentId', document?.id ?? ingestionRun?.documentId ?? latestIngestionRun?.documentId ?? firstSearchResult?.documentId);
  assignString(captured, 'ingestionRunId', ingestionRun?.id ?? latestIngestionRun?.id ?? firstIngestionRun?.id);

  return captured;
}

function assignString<T extends keyof SharedDemoVariables>(
  target: Partial<SharedDemoVariables>,
  key: T,
  value: unknown,
) {
  if (typeof value === 'string' && value.trim().length > 0) {
    target[key] = value;
  }
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function firstRecord(value: unknown) {
  return Array.isArray(value) ? asRecord(value[0]) : null;
}

function formatMetadata(value: unknown) {
  const record = asRecord(value);
  if (!record) {
    return 'metadata: -';
  }

  return Object.entries(record)
    .map(([key, item]) => `${key}=${String(item)}`)
    .join(', ');
}

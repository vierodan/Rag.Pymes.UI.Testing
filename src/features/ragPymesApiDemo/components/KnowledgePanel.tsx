import { useState, type ReactNode } from 'react';
import { getLastResponseStatus } from '../../../api/httpClient';
import { ragPymesApi } from '../../../api/ragPymesApi';
import type {
  CreateKnowledgeBaseRequest,
  GenerateKnowledgeAnswerRequest,
  KnowledgeSearchRequest,
} from '../../../api/contracts';
import type { SharedDemoVariables, UpdateSharedDemoVariables } from '../types/demoVariables';
import { formatPayload, normalizeApiError, type NormalizedApiError } from './apiResultUtils';
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
  meta: ActionMeta;
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

export function KnowledgePanel({ updateVariables, variables }: KnowledgePanelProps) {
  const [knowledgeBaseForm, setKnowledgeBaseForm] = useState(initialKnowledgeBaseForm);
  const [searchForm, setSearchForm] = useState(initialSearchForm);
  const [answerForm, setAnswerForm] = useState(initialAnswerForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

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

      setResult({
        captured,
        latencyMs,
        meta,
        payload,
        status,
        state: 'success',
      });
    } catch (error) {
      const normalizedError = normalizeApiError(
        error,
        'Comprueba tenantId, knowledgeBaseId, documentId, ingestionRunId, token Bearer y permisos Knowledge.',
      );

      setResult({
        captured: {},
        error: normalizedError,
        latencyMs: Math.round(performance.now() - startedAt),
        meta,
        payload: normalizedError.problem,
        status: normalizedError.status ?? null,
        state: 'error',
      });
    } finally {
      setActiveOperationId(null);
    }
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
        <FlowPanel title="Knowledge bases">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Crea una base dentro del tenant usando los ejemplos Postman."
            meta={actions.createKnowledgeBase}
            onRun={() =>
              runAction(actions.createKnowledgeBase, () =>
                ragPymesApi.knowledge.createKnowledgeBase(
                  variables.tenantId,
                  toCreateKnowledgeBaseRequest(knowledgeBaseForm),
                ),
              )
            }
            title="Create knowledge base"
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
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.listKnowledgeBases}
              onRun={() =>
                runAction(actions.listKnowledgeBases, () =>
                  ragPymesApi.knowledge.listKnowledgeBases(variables.tenantId),
                )
              }
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.getKnowledgeBase}
              onRun={() =>
                runAction(actions.getKnowledgeBase, () =>
                  ragPymesApi.knowledge.getKnowledgeBase(variables.tenantId, variables.knowledgeBaseId),
                )
              }
            />
          </div>
        </FlowPanel>

        <FlowPanel title="Documents">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Sube un archivo real via multipart/form-data. El cliente no fija Content-Type manualmente."
            meta={actions.uploadKnowledgeDocument}
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
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.getKnowledgeDocument}
              onRun={() =>
                runAction(actions.getKnowledgeDocument, () =>
                  ragPymesApi.knowledge.getKnowledgeDocument(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.deleteKnowledgeDocument}
              onRun={() =>
                runAction(actions.deleteKnowledgeDocument, () =>
                  ragPymesApi.knowledge.deleteKnowledgeDocument(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
            />
          </div>
        </FlowPanel>

        <FlowPanel title="Ingestion">
          <div className={styles.buttonRow}>
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.listDocumentIngestionRuns}
              onRun={() =>
                runAction(actions.listDocumentIngestionRuns, () =>
                  ragPymesApi.knowledge.listDocumentIngestionRuns(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.getIngestionRun}
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
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.reindexKnowledgeDocument}
              onRun={() =>
                runAction(actions.reindexKnowledgeDocument, () =>
                  ragPymesApi.knowledge.reindexKnowledgeDocument(
                    variables.tenantId,
                    variables.knowledgeBaseId,
                    variables.documentId,
                  ),
                )
              }
            />
          </div>
        </FlowPanel>

        <FlowPanel title="Retrieval y RAG">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Busqueda semantica. Filters es JSON opcional string-string."
            meta={actions.searchKnowledge}
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

      <section className={styles.resultPanel} data-state={result?.state ?? 'idle'}>
        <div className={styles.resultHeader}>
          <div>
            <p className={styles.eyebrow}>Resultado Knowledge</p>
            <h3>{result ? result.meta.operationId : 'Sin ejecutar'}</h3>
          </div>
          <div className={styles.resultMeta}>
            <span>{result?.meta.method ?? '-'}</span>
            <span>HTTP {result?.status ?? '-'}</span>
            <span>{result ? `${result.latencyMs} ms` : '- ms'}</span>
          </div>
        </div>

        {result ? (
          <div className={styles.endpointLine}>
            <span>{result.meta.endpoint}</span>
            <span>{result.meta.operationId}</span>
          </div>
        ) : null}

        {result?.error ? (
          <div className={styles.errorBox}>
            <strong>{result.error.name}</strong>
            <p>{result.error.message}</p>
            {result.error.detail ? <p>{result.error.detail}</p> : null}
          </div>
        ) : null}

        {result && Object.keys(result.captured).length > 0 ? (
          <div className={styles.capturedBox}>
            <strong>Variables actualizadas</strong>
            <span>{Object.entries(result.captured).map(([key, value]) => `${key}: ${value}`).join(' | ')}</span>
          </div>
        ) : null}

        <KnowledgeResponseSummary payload={result?.payload} />

        <pre className={styles.payload}>
          {formatPayload(result?.error?.problem ?? result?.payload, 'Ejecuta una accion Knowledge para ver payload o error.')}
        </pre>
      </section>
    </div>
  );
}

interface FlowPanelProps {
  children: ReactNode;
  title: string;
}

function FlowPanel({ children, title }: FlowPanelProps) {
  return (
    <section className={styles.flowPanel}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

interface ActionBlockProps {
  activeOperationId: string | null;
  children?: ReactNode;
  description: string;
  meta: ActionMeta;
  onRun: () => void;
  title: string;
}

function ActionBlock({ activeOperationId, children, description, meta, onRun, title }: ActionBlockProps) {
  return (
    <article className={styles.actionBlock}>
      <ActionHeader description={description} meta={meta} title={title} />
      {children}
      <button disabled={activeOperationId !== null} onClick={onRun} type="button">
        {activeOperationId === meta.operationId ? 'Ejecutando...' : `Ejecutar ${meta.operationId}`}
      </button>
    </article>
  );
}

interface SmallActionButtonProps {
  activeOperationId: string | null;
  meta: ActionMeta;
  onRun: () => void;
}

function SmallActionButton({ activeOperationId, meta, onRun }: SmallActionButtonProps) {
  return (
    <button className={styles.smallAction} disabled={activeOperationId !== null} onClick={onRun} type="button">
      <span>{meta.method}</span>
      {activeOperationId === meta.operationId ? 'Ejecutando...' : meta.operationId}
    </button>
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
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <dl>
        <div>
          <dt>method</dt>
          <dd>{meta.method}</dd>
        </div>
        <div>
          <dt>endpoint</dt>
          <dd>{meta.endpoint}</dd>
        </div>
        <div>
          <dt>operationId</dt>
          <dd>{meta.operationId}</dd>
        </div>
      </dl>
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

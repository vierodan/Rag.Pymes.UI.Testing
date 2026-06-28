import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import apiDefinition from '../../../../api-definition/RagPymes-v1.json';
import { ApiHttpError } from '../../../api/apiError';
import { httpClient } from '../../../api/httpClient';
import postmanCollection from '../../../data/postmanCollection.json';
import { buildOpenApiContractIndex } from '../../../lib/openapi';
import { buildCatalog, resolveTemplateValue } from '../../../lib/postman';
import type { ApiConnectionSettings, UpdateApiConnectionSettings } from '../../../types/connection';
import type { OpenApiDocument, OperationContract } from '../../../types/openapi';
import type { ApiEndpoint, EndpointField } from '../../../types/postman';
import type { SharedDemoVariables, UpdateSharedDemoVariables } from '../types/demoVariables';
import { normalizeApiError } from './apiResultUtils';
import { ApiActionButton } from './ApiActionButton';
import { EndpointStepTitle } from './EndpointStepTitle';
import { OperationResultCard, type OperationResult } from './OperationResultCard';
import styles from './EndpointExplorer.module.css';

type TokenMode = 'required' | 'always' | 'never';

interface EndpointExplorerProps {
  connectionSettings: ApiConnectionSettings;
  onConnectionSettingsChange: UpdateApiConnectionSettings;
  updateVariables: UpdateSharedDemoVariables;
  variables: SharedDemoVariables;
}

interface BuiltRequest {
  auth: boolean;
  body?: BodyInit | string;
  headers: Headers;
  path: string;
  query: Record<string, string>;
}

const catalog = buildCatalog(postmanCollection);
const contractIndex = buildOpenApiContractIndex(apiDefinition as OpenApiDocument);
const catalogVariableKeys = new Set(catalog.variables.map((variable) => variable.key));

const bodyInitialState = Object.fromEntries(
  catalog.endpoints
    .filter((endpoint) => endpoint.body?.mode === 'raw' && endpoint.body.raw)
    .map((endpoint) => [endpoint.id, endpoint.body?.raw ?? '']),
);

const queryInitialState = Object.fromEntries(
  catalog.endpoints.map((endpoint) => [
    endpoint.id,
    Object.fromEntries(endpoint.query.map((query) => [query.key, query.value])),
  ]),
);

const variableInitialState = Object.fromEntries(
  catalog.variables
    .filter((variable) => variable.key !== 'baseUrl' && variable.key !== 'accessToken')
    .map((variable) => [variable.key, variable.value]),
);

const sharedVariableByPostmanKey: Partial<Record<string, keyof SharedDemoVariables>> = {
  documentId: 'documentId',
  ingestionRunId: 'ingestionRunId',
  invitationId: 'invitationId',
  knowledgeBaseId: 'knowledgeBaseId',
  membershipId: 'membershipId',
  tenantId: 'tenantId',
  token: 'invitationToken',
};

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter(Boolean)
    .map((name) => styles[name as string])
    .join(' ');

export function EndpointExplorer({
  connectionSettings,
  onConnectionSettingsChange,
  updateVariables,
  variables: sharedVariables,
}: EndpointExplorerProps) {
  const [tokenMode, setTokenMode] = useState<TokenMode>('required');
  const [localVariables, setLocalVariables] = useState<Record<string, string>>(variableInitialState);
  const [pathOverrides, setPathOverrides] = useState<Record<string, string>>({});
  const [queryByEndpoint, setQueryByEndpoint] =
    useState<Record<string, Record<string, string>>>(queryInitialState);
  const [bodyByEndpoint, setBodyByEndpoint] = useState<Record<string, string>>(bodyInitialState);
  const [filesByField, setFilesByField] = useState<Record<string, File | null>>({});
  const [formValuesByField, setFormValuesByField] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(catalog.endpoints[0]?.id ?? '');
  const [isSending, setIsSending] = useState(false);
  const [resultsByEndpoint, setResultsByEndpoint] = useState<Record<string, OperationResult | undefined>>({});

  const requestVariables = useMemo<Record<string, string>>(
    () => buildRequestVariables(localVariables, sharedVariables),
    [localVariables, sharedVariables],
  );

  const filteredEndpoints = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return catalog.endpoints.filter((endpoint) => {
      const matchesSearch =
        !normalizedSearch ||
        `${endpoint.method} ${endpoint.path} ${endpoint.name} ${endpoint.group.join(' ')}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesMethod = methodFilter === 'ALL' || endpoint.method === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [methodFilter, search]);

  const selectedEndpoint =
    catalog.endpoints.find((endpoint) => endpoint.id === selectedId) ?? catalog.endpoints[0];
  const selectedContract = contractIndex.get(`${selectedEndpoint.method} ${selectedEndpoint.openApiPath}`);

  function updateVariable(key: string, value: string) {
    const sharedKey = sharedVariableByPostmanKey[key];
    if (sharedKey) {
      updateVariables({ [sharedKey]: value } as Partial<SharedDemoVariables>);
      return;
    }

    setLocalVariables((current) => ({ ...current, [key]: value }));
  }

  function updatePathValue(endpoint: ApiEndpoint, field: EndpointField, value: string) {
    if (catalogVariableKeys.has(field.key)) {
      updateVariable(field.key, value);
      return;
    }

    setPathOverrides((current) => ({ ...current, [`${endpoint.id}:${field.key}`]: value }));
  }

  function updateQueryValue(endpoint: ApiEndpoint, key: string, value: string) {
    setQueryByEndpoint((current) => ({
      ...current,
      [endpoint.id]: {
        ...(current[endpoint.id] ?? {}),
        [key]: value,
      },
    }));
  }

  function updateBody(endpoint: ApiEndpoint, value: string) {
    setBodyByEndpoint((current) => ({ ...current, [endpoint.id]: value }));
  }

  function getVariableValue(key: string) {
    const sharedKey = sharedVariableByPostmanKey[key];

    return sharedKey ? sharedVariables[sharedKey] : localVariables[key] ?? '';
  }

  function getPathValue(endpoint: ApiEndpoint, field: EndpointField) {
    return requestVariables[field.key] ?? pathOverrides[`${endpoint.id}:${field.key}`] ?? '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    const startedAt = performance.now();

    try {
      const request = buildRequest(selectedEndpoint);
      const result = await httpClient.execute(selectedEndpoint.method, request.path, {
        auth: request.auth,
        body: request.body,
        headers: request.headers,
        query: request.query,
      });

      setResultsByEndpoint((current) => ({
        ...current,
        [selectedEndpoint.id]: {
          error: result.ok
            ? undefined
            : normalizeApiError(
                new ApiHttpError(result.status, result.statusText, result.payload),
                'La API ha devuelto una respuesta HTTP de error.',
              ),
          latencyMs: Math.round(performance.now() - startedAt),
          payload: {
            body: result.payload ?? null,
            headers: Object.fromEntries(result.headers),
            requestUrl: result.requestUrl,
            statusText: result.statusText,
          },
          status: result.status,
          state: result.ok ? 'success' : 'error',
        },
      }));
    } catch (requestError) {
      const normalizedError = normalizeApiError(
        requestError,
        'Comprueba base URL, CORS, token Bearer y variables de path/query.',
      );
      setResultsByEndpoint((current) => ({
        ...current,
        [selectedEndpoint.id]: {
          error: normalizedError,
          latencyMs: Math.round(performance.now() - startedAt),
          payload: normalizedError.problem,
          status: normalizedError.status ?? null,
          state: 'error',
        },
      }));
    } finally {
      setIsSending(false);
    }
  }

  function buildRequest(endpoint: ApiEndpoint): BuiltRequest {
    const headers = new Headers();
    const method = endpoint.method;
    const endpointQuery = queryByEndpoint[endpoint.id] ?? {};
    const path = endpoint.path.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, (_, key: string) => {
      const value = requestVariables[key] ?? pathOverrides[`${endpoint.id}:${key}`] ?? '';
      if (!value.trim()) {
        throw new Error(`Missing path variable: ${key}`);
      }

      return encodeURIComponent(value);
    });

    const query: Record<string, string> = {};
    endpoint.query.forEach((queryField) => {
      const rawValue = endpointQuery[queryField.key] ?? queryField.value;
      const value = resolveTemplateValue(rawValue, requestVariables);
      if (value) {
        query[queryField.key] = value;
      }
    });

    endpoint.headers.forEach((header) => {
      const value = resolveTemplateValue(header.value, requestVariables);
      if (value) {
        headers.set(header.key, value);
      }
    });

    const request: BuiltRequest = {
      auth: shouldAttachToken(endpoint),
      headers,
      path,
      query,
    };

    if (method !== 'GET' && method !== 'HEAD' && endpoint.body) {
      if (endpoint.body.mode === 'formdata') {
        const formData = new FormData();
        endpoint.body.formdata.forEach((field) => {
          const key = `${endpoint.id}:${field.key}`;
          const file = filesByField[key];
          const value = formValuesByField[key] ?? resolveTemplateValue(field.value, requestVariables);
          formData.append(field.key, file ?? value);
        });
        headers.delete('Content-Type');
        request.body = formData;
      } else {
        request.body = bodyByEndpoint[endpoint.id] ?? endpoint.body.raw ?? '';
      }
    }

    return request;
  }

  function shouldAttachToken(endpoint: ApiEndpoint) {
    if (tokenMode === 'never') {
      return false;
    }

    return tokenMode === 'always' || endpoint.requiresAuth;
  }

  return (
    <div className={styles.explorer}>
      <section className={cx('advanced-summary')} aria-label="Advanced explorer catalog status">
        <div>
          <span>Postman</span>
          <strong>{catalog.endpoints.length} endpoints</strong>
        </div>
        <div>
          <span>OpenAPI</span>
          <strong>{contractIndex.size} endpoints</strong>
        </div>
        <div>
          <span>Configuracion</span>
          <strong>{connectionSettings.baseUrl || 'Sin base URL'}</strong>
        </div>
      </section>

      <section className={cx('settings-band')} aria-label="Request settings">
        <label>
          API base URL global
          <input
            value={connectionSettings.baseUrl}
            onChange={(event) => onConnectionSettingsChange({ baseUrl: event.target.value })}
          />
        </label>
        <label>
          Bearer token global
          <textarea
            className={styles.tokenTextarea}
            value={connectionSettings.bearerToken}
            placeholder="Pega aquí el token Bearer"
            rows={6}
            onChange={(event) => onConnectionSettingsChange({ bearerToken: event.target.value })}
          />
        </label>
        <label>
          Token mode
          <select value={tokenMode} onChange={(event) => setTokenMode(event.target.value as TokenMode)}>
            <option value="required">Only protected endpoints</option>
            <option value="always">Attach to every request</option>
            <option value="never">Do not attach</option>
          </select>
        </label>
      </section>

      <section className={cx('variables-band')} aria-label="Shared variables">
        {catalog.variables
          .filter((variable) => variable.key !== 'baseUrl' && variable.key !== 'accessToken')
          .map((variable) => (
            <label key={variable.key} title={variable.description}>
              {variable.key}
              <input value={getVariableValue(variable.key)} onChange={(event) => updateVariable(variable.key, event.target.value)} />
            </label>
          ))}
      </section>

      <div className={styles.workspace}>
        <aside className={cx('endpoint-list')} aria-label="Endpoint list">
          <div className={styles.filters}>
            <input
              value={search}
              placeholder="Search endpoint"
              onChange={(event) => setSearch(event.target.value)}
            />
            <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
              <option value="ALL">All methods</option>
              {Array.from(new Set(catalog.endpoints.map((endpoint) => endpoint.method))).map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className={cx('endpoint-buttons')}>
            {filteredEndpoints.map((endpoint) => (
              <button
                className={cx('endpoint-button', endpoint.id === selectedEndpoint.id && 'active')}
                key={endpoint.id}
                onClick={() => setSelectedId(endpoint.id)}
                type="button"
              >
                <span className={cx('method', `method-${endpoint.method.toLowerCase()}`)}>{endpoint.method}</span>
                <span>
                  <strong>{endpoint.name}</strong>
                  <small>{endpoint.path}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <form className={cx('request-panel')} onSubmit={handleSubmit}>
          <section className={cx('endpoint-heading')}>
            <div>
              <p>{selectedEndpoint.group.join(' / ')}</p>
              <EndpointStepTitle path={selectedEndpoint.path} title={selectedEndpoint.name} />
            </div>
            <span className={cx('method', `method-${selectedEndpoint.method.toLowerCase()}`)}>
              {selectedEndpoint.method}
            </span>
          </section>

          <section className={styles.description} aria-label="Postman description">
            <div className={cx('section-title')}>Postman description</div>
            {formatDescription(selectedEndpoint.description).map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </section>

          {selectedContract ? (
            <ContractSummary contract={selectedContract} />
          ) : (
            <section className={cx('contract-summary')} aria-label="OpenAPI contract">
              <div className={cx('section-title')}>OpenAPI contract</div>
              <p className={cx('empty-state')}>No OpenAPI operation matched this Postman endpoint.</p>
            </section>
          )}

          {selectedEndpoint.pathVariables.length > 0 && (
            <Fieldset title="Path variables">
              {selectedEndpoint.pathVariables.map((field) => (
                <label key={field.key} title={field.description}>
                  {field.key}
                  <input
                    value={getPathValue(selectedEndpoint, field)}
                    onChange={(event) => updatePathValue(selectedEndpoint, field, event.target.value)}
                  />
                </label>
              ))}
            </Fieldset>
          )}

          {selectedEndpoint.query.length > 0 && (
            <Fieldset title="Query string">
              {selectedEndpoint.query.map((field) => (
                <label key={field.key} title={field.description}>
                  {field.key}
                  <input
                    value={queryByEndpoint[selectedEndpoint.id]?.[field.key] ?? field.value}
                    onChange={(event) => updateQueryValue(selectedEndpoint, field.key, event.target.value)}
                  />
                </label>
              ))}
            </Fieldset>
          )}

          {selectedEndpoint.body?.mode === 'raw' && (
            <section className={cx('editor-block')}>
              <div className={cx('section-title')}>Request body</div>
              <textarea
                spellCheck={false}
                value={bodyByEndpoint[selectedEndpoint.id] ?? selectedEndpoint.body.raw ?? ''}
                onChange={(event) => updateBody(selectedEndpoint, event.target.value)}
              />
            </section>
          )}

          {selectedEndpoint.body?.mode === 'formdata' && (
            <Fieldset title="Multipart form data">
              {selectedEndpoint.body.formdata.map((field) => {
                const key = `${selectedEndpoint.id}:${field.key}`;

                return (
                  <label key={field.key} title={field.description}>
                    {field.key}
                    {field.type === 'file' ? (
                      <input
                        type="file"
                        onChange={(event) =>
                          setFilesByField((current) => ({
                            ...current,
                            [key]: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                    ) : (
                      <input
                        value={formValuesByField[key] ?? resolveTemplateValue(field.value, requestVariables)}
                        onChange={(event) =>
                          setFormValuesByField((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </label>
                );
              })}
            </Fieldset>
          )}

          <div className={styles.actions}>
            <ApiActionButton
              disabled={isSending}
              method={selectedEndpoint.method}
              path={selectedEndpoint.path}
              type="submit"
            />
            <span>{selectedEndpoint.requiresAuth ? 'Requiere autenticación' : 'No requiere autenticación'}</span>
          </div>

          <OperationResultCard
            idleMessage="Ejecuta este endpoint para inspeccionar el estado HTTP, la URL resuelta, las cabeceras y el cuerpo devuelto por la API."
            onClearResult={
              resultsByEndpoint[selectedEndpoint.id]
                ? () =>
                    setResultsByEndpoint((current) => ({
                      ...current,
                      [selectedEndpoint.id]: undefined,
                    }))
                : undefined
            }
            result={resultsByEndpoint[selectedEndpoint.id]}
          />
        </form>
      </div>
    </div>
  );
}

function Fieldset({ children, title }: { children: ReactNode; title: string }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className={cx('field-grid')}>{children}</div>
    </fieldset>
  );
}

function ContractSummary({ contract }: { contract: OperationContract }) {
  return (
    <section className={cx('contract-summary')} aria-label="OpenAPI contract">
      <div className={cx('section-title')}>OpenAPI contract</div>
      <div className={cx('contract-grid')}>
        <ContractItem label="operationId" value={contract.operationId} />
        <ContractItem label="tags" value={contract.tags.join(', ')} />
        <ContractItem label="summary" value={contract.summary || 'None'} />
        <ContractItem label="request" value={contract.requestContentTypes.join(', ') || 'No body'} />
        <ContractItem label="request schema" value={contract.requestSchemaNames.join(', ') || 'None'} />
        <ContractItem label="responses" value={contract.responseCodes.join(', ')} />
        <ContractItem label="response schemas" value={contract.responseSchemaNames.join(', ') || 'None'} />
        <ContractItem label="required path" value={contract.requiredPathParams.join(', ') || 'None'} />
        <ContractItem label="required query" value={contract.requiredQueryParams.join(', ') || 'None'} />
      </div>
    </section>
  );
}

function ContractItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildRequestVariables(
  localVariables: Record<string, string>,
  sharedVariables: SharedDemoVariables,
): Record<string, string> {
  return {
    ...localVariables,
    documentId: sharedVariables.documentId,
    ingestionRunId: sharedVariables.ingestionRunId,
    invitationId: sharedVariables.invitationId,
    knowledgeBaseId: sharedVariables.knowledgeBaseId,
    membershipId: sharedVariables.membershipId,
    tenantId: sharedVariables.tenantId,
    token: sharedVariables.invitationToken,
  };
}

function formatDescription(description: string) {
  return description
    .split('\n')
    .map((line) =>
      line
        .replace(/^#+\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .trim(),
    )
    .filter(Boolean);
}

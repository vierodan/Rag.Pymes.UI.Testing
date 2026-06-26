import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import apiDefinition from '../../../../api-definition/RagPymes-v1.json';
import postmanCollection from '../../../data/postmanCollection.json';
import { buildOpenApiContractIndex } from '../../../lib/openapi';
import { buildCatalog, resolveTemplateValue } from '../../../lib/postman';
import type { OpenApiDocument, OperationContract } from '../../../types/openapi';
import type { ApiEndpoint, EndpointField } from '../../../types/postman';
import styles from './EndpointExplorer.module.css';

type TokenMode = 'required' | 'always' | 'never';

interface ApiResponse {
  body: string;
  durationMs: number;
  headers: Array<[string, string]>;
  ok: boolean;
  requestUrl: string;
  status: number;
  statusText: string;
}

const catalog = buildCatalog(postmanCollection);
const contractIndex = buildOpenApiContractIndex(apiDefinition as OpenApiDocument);
const defaultBaseUrl =
  import.meta.env.VITE_RAGPYMES_API_BASE_URL ??
  (apiDefinition as OpenApiDocument).servers?.[0]?.url ??
  catalog.variables.find((variable) => variable.key === 'baseUrl')?.value ??
  'http://localhost:5088';

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

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter(Boolean)
    .map((name) => styles[name as string])
    .join(' ');

export function EndpointExplorer() {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [accessToken, setAccessToken] = useState('');
  const [tokenMode, setTokenMode] = useState<TokenMode>('required');
  const [variables, setVariables] = useState<Record<string, string>>(variableInitialState);
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
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setVariables((current) => ({ ...current, [key]: value }));
  }

  function updatePathValue(endpoint: ApiEndpoint, field: EndpointField, value: string) {
    if (Object.hasOwn(variables, field.key)) {
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

  function getPathValue(endpoint: ApiEndpoint, field: EndpointField) {
    return variables[field.key] ?? pathOverrides[`${endpoint.id}:${field.key}`] ?? '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError(null);
    setResponse(null);

    try {
      const request = buildRequest(selectedEndpoint);
      const startedAt = performance.now();
      const result = await fetch(request.url, request.init);
      const body = await readResponseBody(result);

      setResponse({
        body,
        durationMs: Math.round(performance.now() - startedAt),
        headers: Array.from(result.headers.entries()),
        ok: result.ok,
        requestUrl: request.url,
        status: result.status,
        statusText: result.statusText,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected request error');
    } finally {
      setIsSending(false);
    }
  }

  function buildRequest(endpoint: ApiEndpoint) {
    const headers = new Headers();
    const method = endpoint.method;
    const endpointQuery = queryByEndpoint[endpoint.id] ?? {};
    const path = endpoint.path.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, (_, key: string) => {
      const value = variables[key] ?? pathOverrides[`${endpoint.id}:${key}`] ?? '';
      if (!value.trim()) {
        throw new Error(`Missing path variable: ${key}`);
      }

      return encodeURIComponent(value);
    });

    const url = new URL(`${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`);
    endpoint.query.forEach((query) => {
      const rawValue = endpointQuery[query.key] ?? query.value;
      const value = resolveTemplateValue(rawValue, variables);
      if (value) {
        url.searchParams.set(query.key, value);
      }
    });

    endpoint.headers.forEach((header) => {
      const value = resolveTemplateValue(header.value, variables);
      if (value) {
        headers.set(header.key, value);
      }
    });

    if (shouldAttachToken(endpoint) && accessToken.trim()) {
      headers.set('Authorization', `Bearer ${accessToken.trim()}`);
    }

    const init: RequestInit = { method, headers };
    if (method !== 'GET' && method !== 'HEAD' && endpoint.body) {
      if (endpoint.body.mode === 'formdata') {
        const formData = new FormData();
        endpoint.body.formdata.forEach((field) => {
          const key = `${endpoint.id}:${field.key}`;
          const file = filesByField[key];
          formData.append(field.key, file ?? formValuesByField[key] ?? resolveTemplateValue(field.value, variables));
        });
        headers.delete('Content-Type');
        init.body = formData;
      } else {
        init.body = bodyByEndpoint[endpoint.id] ?? endpoint.body.raw ?? '';
      }
    }

    return { init, url: url.toString() };
  }

  function shouldAttachToken(endpoint: ApiEndpoint) {
    if (tokenMode === 'never') {
      return false;
    }

    return tokenMode === 'always' || endpoint.requiresAuth;
  }

  return (
    <div className={styles.explorer}>
      <section className={cx('settings-band')} aria-label="Request settings">
        <label>
          API base URL
          <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
        </label>
        <label>
          Bearer token
          <input
            type="password"
            value={accessToken}
            placeholder="Paste access token"
            onChange={(event) => setAccessToken(event.target.value)}
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
              <input
                value={variables[variable.key] ?? ''}
                onChange={(event) => updateVariable(variable.key, event.target.value)}
              />
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
              <h2>{selectedEndpoint.name}</h2>
            </div>
            <span className={cx('method', `method-${selectedEndpoint.method.toLowerCase()}`)}>
              {selectedEndpoint.method}
            </span>
          </section>

          <code className={cx('path-preview')}>{selectedEndpoint.path}</code>

          <section className={styles.description}>
            {formatDescription(selectedEndpoint.description).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>

          {selectedContract && <ContractSummary contract={selectedContract} />}

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
                        defaultValue={resolveTemplateValue(field.value, variables)}
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
            <button disabled={isSending} type="submit">
              {isSending ? 'Sending...' : 'Send request'}
            </button>
            <span>{selectedEndpoint.requiresAuth ? 'Auth expected' : 'No auth expected'}</span>
          </div>
        </form>

        <aside className={cx('response-panel')} aria-label="Response">
          <h2>Response</h2>
          {error && <pre className={cx('error-output')}>{error}</pre>}
          {response ? (
            <>
              <div className={cx('status', response.ok ? 'ok' : 'fail')}>
                <strong>
                  {response.status} {response.statusText}
                </strong>
                <span>{response.durationMs} ms</span>
              </div>
              <code className={cx('request-url')}>{response.requestUrl}</code>
              <details>
                <summary>Response headers</summary>
                <pre>{response.headers.map(([key, value]) => `${key}: ${value}`).join('\n')}</pre>
              </details>
              <pre className={cx('response-body')}>{response.body || '(empty response)'}</pre>
            </>
          ) : (
            <p className={cx('empty-state')}>Send a request to inspect status, headers, and body.</p>
          )}
        </aside>
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
      <div className={cx('section-title')}>API contract</div>
      <div className={cx('contract-grid')}>
        <ContractItem label="operationId" value={contract.operationId} />
        <ContractItem label="tags" value={contract.tags.join(', ')} />
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

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return '';
  }

  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

import { useMemo, useState } from 'react';
import { setApiBaseUrl } from '../../../api/apiConfig';
import { getLastResponseStatus, setAccessTokenGetter } from '../../../api/httpClient';
import { ragPymesApi } from '../../../api/ragPymesApi';
import type { ConnectionSummary, ConnectionState } from '../../../types/connection';
import { formatPayload, normalizeApiError, type NormalizedApiError } from './apiResultUtils';
import styles from './ConnectionHealthPanel.module.css';

type HealthEndpointId = 'health' | 'live' | 'ready';

interface HealthEndpoint {
  id: HealthEndpointId;
  label: string;
  path: string;
  request: () => Promise<unknown>;
}

interface HealthResult {
  checkedAt: string;
  endpoint: string;
  error?: NormalizedApiError;
  latencyMs: number;
  payload?: unknown;
  status: number | null;
  state: Exclude<ConnectionState, 'idle' | 'checking'>;
}

interface ConnectionHealthPanelProps {
  initialBaseUrl: string;
  onConnectionChange: (summary: ConnectionSummary) => void;
}

const healthEndpoints: HealthEndpoint[] = [
  {
    id: 'health',
    label: 'GET /health',
    path: '/health',
    request: () => ragPymesApi.health.getHealth(),
  },
  {
    id: 'live',
    label: 'GET /health/live',
    path: '/health/live',
    request: () => ragPymesApi.health.getLiveHealth(),
  },
  {
    id: 'ready',
    label: 'GET /health/ready',
    path: '/health/ready',
    request: () => ragPymesApi.health.getReadyHealth(),
  },
];

export function ConnectionHealthPanel({ initialBaseUrl, onConnectionChange }: ConnectionHealthPanelProps) {
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [bearerToken, setBearerToken] = useState('');
  const [activeEndpointId, setActiveEndpointId] = useState<HealthEndpointId | null>(null);
  const [result, setResult] = useState<HealthResult | null>(null);

  const activeEndpoint = useMemo(
    () => healthEndpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? null,
    [activeEndpointId],
  );

  async function runHealthCheck(endpoint: HealthEndpoint) {
    const trimmedBaseUrl = baseUrl.trim();
    const invalidMessage = getBaseUrlValidationMessage(trimmedBaseUrl);

    if (invalidMessage) {
      const now = new Date().toISOString();
      const normalizedError = {
        message: invalidMessage,
        name: 'InvalidApiBaseUrl',
      };
      setResult({
        checkedAt: now,
        endpoint: endpoint.path,
        error: normalizedError,
        latencyMs: 0,
        status: null,
        state: 'invalid',
      });
      onConnectionChange({
        checkedAt: now,
        endpoint: endpoint.path,
        message: invalidMessage,
        state: 'invalid',
        status: null,
      });
      return;
    }

    setApiBaseUrl(trimmedBaseUrl);
    setAccessTokenGetter(() => bearerToken.trim() || undefined);
    setActiveEndpointId(endpoint.id);
    onConnectionChange({
      endpoint: endpoint.path,
      message: `Ejecutando ${endpoint.label}`,
      state: 'checking',
      status: null,
    });

    const startedAt = performance.now();
    const checkedAt = new Date().toISOString();

    try {
      const payload = await endpoint.request();
      const latencyMs = Math.round(performance.now() - startedAt);
      const status = getLastResponseStatus();
      setResult({
        checkedAt,
        endpoint: endpoint.path,
        latencyMs,
        payload,
        status,
        state: 'online',
      });
      onConnectionChange({
        checkedAt,
        endpoint: endpoint.path,
        latencyMs,
        message: `${endpoint.label} respondio correctamente`,
        state: 'online',
        status,
      });
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startedAt);
      const normalizedError = normalizeApiError(
        error,
        'Comprueba que el backend este arrancado, la URL base y CORS.',
      );
      const status = normalizedError.status ?? null;
      const state = normalizedError.name === 'AbortError' ? 'offline' : 'offline';
      setResult({
        checkedAt,
        endpoint: endpoint.path,
        error: normalizedError,
        latencyMs,
        status,
        state,
      });
      onConnectionChange({
        checkedAt,
        endpoint: endpoint.path,
        latencyMs,
        message: normalizedError.message,
        state,
        status,
      });
    } finally {
      setActiveEndpointId(null);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.formGrid}>
        <label>
          <span>API base URL</span>
          <input
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="http://localhost:5088"
            type="url"
            value={baseUrl}
          />
        </label>
        <label>
          <span>Bearer token opcional</span>
          <textarea
            onChange={(event) => setBearerToken(event.target.value)}
            placeholder="Pega aqui el token si quieres probar endpoints protegidos"
            rows={3}
            value={bearerToken}
          />
        </label>
      </div>

      <div className={styles.actions} aria-label="Health checks">
        {healthEndpoints.map((endpoint) => (
          <button
            disabled={activeEndpoint !== null}
            key={endpoint.id}
            onClick={() => void runHealthCheck(endpoint)}
            type="button"
          >
            {activeEndpointId === endpoint.id ? 'Comprobando...' : endpoint.label}
          </button>
        ))}
      </div>

      <div className={styles.result} data-connection-result data-state={result?.state ?? 'idle'}>
        <div className={styles.resultSummary}>
          <div>
            <p className={styles.resultLabel}>Ultima comprobacion</p>
            <p className={styles.resultTitle}>
              {result ? `${result.endpoint} - ${stateLabel[result.state]}` : 'Sin ejecutar'}
            </p>
          </div>
          <div className={styles.metrics}>
            <span>HTTP {result?.status ?? '-'}</span>
            <span>{result ? `${result.latencyMs} ms` : '- ms'}</span>
          </div>
        </div>

        {result?.error ? (
          <div className={styles.errorBox}>
            <strong>{result.error.name}</strong>
            <p>{result.error.message}</p>
            {result.error.detail ? <p>{result.error.detail}</p> : null}
          </div>
        ) : null}

        <pre className={styles.payload}>{formatPayload(result?.error?.problem ?? result?.payload)}</pre>
      </div>
    </div>
  );
}

const stateLabel: Record<Exclude<ConnectionState, 'idle' | 'checking'>, string> = {
  invalid: 'base URL invalida',
  offline: 'sin conexion',
  online: 'online',
};

function getBaseUrlValidationMessage(baseUrl: string) {
  if (!baseUrl) {
    return 'Configura una API base URL antes de ejecutar health checks.';
  }

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'La API base URL debe empezar por http:// o https://.';
    }
  } catch {
    return 'La API base URL no es valida. Usa una URL absoluta, por ejemplo http://localhost:5088.';
  }

  return '';
}

import { useMemo, useState } from 'react';
import { setApiBaseUrl } from '../../../api/apiConfig';
import { getLastResponseStatus, setAccessTokenGetter } from '../../../api/httpClient';
import { ragPymesApi } from '../../../api/ragPymesApi';
import type {
  ApiConnectionSettings,
  ConnectionSummary,
  ConnectionState,
  UpdateApiConnectionSettings,
} from '../../../types/connection';
import { normalizeApiError, type NormalizedApiError } from './apiResultUtils';
import { ApiActionButton } from './ApiActionButton';
import { EndpointStepTitle } from './EndpointStepTitle';
import { FeatureExplainerCards, type FeatureExplainerCardsProps } from './FeatureExplainerCards';
import { OperationResultCard } from './OperationResultCard';
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
  connectionSettings: ApiConnectionSettings;
  onConnectionChange: (summary: ConnectionSummary) => void;
  onConnectionSettingsChange: UpdateApiConnectionSettings;
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

const healthEndpointHelp: Record<HealthEndpointId, FeatureExplainerCardsProps> = {
  health: {
    ariaLabel: 'Como probar y que hace el endpoint GET /health',
    howTo: {
      hint: 'Úsalo como smoke test rápido para confirmar que el host responde y devuelve el estado agregado esperado.',
      steps: [
        'Configura API base URL con la URL del backend, por ejemplo http://localhost:5088.',
        'No hace falta Bearer token: este endpoint público de diagnóstico no requiere autenticación.',
        'Pulsa Ejecutar y verifica que la respuesta contiene status y entries.',
      ],
    },
    what: {
      description: 'Devuelve el estado general de salud del host RagPymes.Api.',
      fields: [
        'Ejecuta GET /health.',
        'No tiene body, parámetros de ruta ni query string.',
        'La respuesta usa el contrato HealthResponse del OpenAPI.',
      ],
      response: [
        '200 OK con status agregado de health.',
        'entries contiene el detalle de los checks internos cuando el backend los expone.',
        'Si la API no está accesible, la UI mostrará el error de conexión o el ProblemDetails devuelto por el backend.',
      ],
    },
  },
  live: {
    ariaLabel: 'Como probar y que hace el endpoint GET /health/live',
    howTo: {
      hint: 'Es el endpoint adecuado para liveness probes: responde si el proceso HTTP está vivo.',
      steps: [
        'Configura API base URL apuntando al host de RagPymes.Api.',
        'Deja el Bearer token vacío; GET /health/live no requiere autenticación.',
        'Pulsa Ejecutar y comprueba que devuelve 200 OK con el estado de liveness.',
      ],
    },
    what: {
      description: 'Comprueba que el proceso HTTP de la API responde.',
      fields: [
        'Ejecuta GET /health/live.',
        'No recibe body ni parámetros.',
        'Debe ser una comprobación ligera para saber si el proceso sigue vivo.',
      ],
      response: [
        '200 OK con status y entries según HealthResponse.',
        'Es útil para orquestadores que necesitan reiniciar el proceso cuando deja de responder.',
        'Errores de red, timeout o ProblemDetails se muestran en la card de resultado de este endpoint.',
      ],
    },
  },
  ready: {
    ariaLabel: 'Como probar y que hace el endpoint GET /health/ready',
    howTo: {
      hint: 'Úsalo para saber si la API puede recibir tráfico real después de validar su configuración crítica.',
      steps: [
        'Configura API base URL con el backend que quieres validar.',
        'No necesitas Bearer token: GET /health/ready es público.',
        'Pulsa Ejecutar y confirma que devuelve 200 OK cuando la API está lista.',
      ],
    },
    what: {
      description: 'Comprueba si la API está preparada para atender tráfico.',
      fields: [
        'Ejecuta GET /health/ready.',
        'No tiene body, parámetros ni query string.',
        'Puede reflejar dependencias o configuración crítica que el host necesita para operar.',
      ],
      response: [
        '200 OK cuando la API está lista.',
        'Devuelve HealthResponse con status y entries.',
        'Si alguna dependencia crítica falla, la card mostrará el error de API o el fallo de conectividad.',
      ],
    },
  },
};

export function ConnectionHealthPanel({
  connectionSettings,
  onConnectionChange,
  onConnectionSettingsChange,
}: ConnectionHealthPanelProps) {
  const [activeEndpointId, setActiveEndpointId] = useState<HealthEndpointId | null>(null);
  const [results, setResults] = useState<Record<HealthEndpointId, HealthResult | undefined>>({
    health: undefined,
    live: undefined,
    ready: undefined,
  });

  const activeEndpoint = useMemo(
    () => healthEndpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? null,
    [activeEndpointId],
  );

  async function runHealthCheck(endpoint: HealthEndpoint) {
    const trimmedBaseUrl = connectionSettings.baseUrl.trim();
    const invalidMessage = getBaseUrlValidationMessage(trimmedBaseUrl);

    if (invalidMessage) {
      const now = new Date().toISOString();
      const normalizedError = {
        message: invalidMessage,
        name: 'InvalidApiBaseUrl',
      };
      setResults((current) => ({
        ...current,
        [endpoint.id]: {
        checkedAt: now,
        endpoint: endpoint.path,
        error: normalizedError,
        latencyMs: 0,
        status: null,
        state: 'invalid',
        },
      }));
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
    setAccessTokenGetter(() => connectionSettings.bearerToken.trim() || undefined);
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
      setResults((current) => ({
        ...current,
        [endpoint.id]: {
        checkedAt,
        endpoint: endpoint.path,
        latencyMs,
        payload,
        status,
        state: 'online',
        },
      }));
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
      setResults((current) => ({
        ...current,
        [endpoint.id]: {
        checkedAt,
        endpoint: endpoint.path,
        error: normalizedError,
        latencyMs,
        status,
        state,
        },
      }));
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
            onChange={(event) => onConnectionSettingsChange({ baseUrl: event.target.value })}
            placeholder="http://localhost:5088"
            type="url"
            value={connectionSettings.baseUrl}
          />
        </label>
        <label>
          <span>Bearer token opcional</span>
          <div className={styles.tokenField}>
            <textarea
              onChange={(event) => onConnectionSettingsChange({ bearerToken: event.target.value })}
              placeholder="Pega aqui el token si quieres probar endpoints protegidos"
              rows={3}
              value={connectionSettings.bearerToken}
            />
            <button
              className={styles.clearTokenButton}
              disabled={!connectionSettings.bearerToken}
              onClick={() => onConnectionSettingsChange({ bearerToken: '' })}
              type="button"
            >
              Borrar
            </button>
          </div>
        </label>
      </div>

      <div className={styles.actions} aria-label="Health checks">
        {healthEndpoints.map((endpoint) => (
          <article className={styles.healthAction} key={endpoint.id}>
            <EndpointStepTitle path={endpoint.path} title={endpoint.label} />
            <FeatureExplainerCards {...healthEndpointHelp[endpoint.id]} />
            <ApiActionButton
              disabled={activeEndpoint !== null}
              method="GET"
              onClick={() => void runHealthCheck(endpoint)}
              path={endpoint.path}
            />
            <OperationResultCard
              idleMessage={`Ejecuta ${endpoint.label} para ver el resultado de este health check.`}
              onClearResult={
                results[endpoint.id]
                  ? () =>
                      setResults((current) => ({
                        ...current,
                        [endpoint.id]: undefined,
                      }))
                  : undefined
              }
              result={toOperationResult(results[endpoint.id])}
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function toOperationResult(result: HealthResult | undefined) {
  if (!result) {
    return undefined;
  }

  return {
    error: result.error,
    latencyMs: result.latencyMs,
    payload: result.payload,
    status: result.status,
    state: result.state === 'online' ? 'success' : 'error',
  } as const;
}

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

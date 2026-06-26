import { ApiHttpError } from '../../../api/apiError';

export interface NormalizedApiError {
  detail?: string;
  message: string;
  name: string;
  problem?: unknown;
  status?: number | null;
}

export function normalizeApiError(error: unknown, fallbackContext: string): NormalizedApiError {
  if (error instanceof ApiHttpError) {
    return {
      detail: error.problem?.detail ?? undefined,
      message: error.message,
      name: `HTTP ${error.status}`,
      problem: error.problem ?? error.payload,
      status: error.status,
    };
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      message: `La peticion ha expirado. ${fallbackContext}`,
      name: 'AbortError',
      status: null,
    };
  }

  if (error instanceof TypeError) {
    return {
      message: `No se pudo conectar con la API. ${fallbackContext}`,
      name: 'NetworkError',
      status: null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name || 'Error',
      status: null,
    };
  }

  return {
    message: 'Error desconocido al ejecutar la accion.',
    name: 'UnknownError',
    status: null,
  };
}

export function formatPayload(value: unknown, emptyMessage = 'Sin payload todavia.') {
  if (value === undefined) {
    return emptyMessage;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

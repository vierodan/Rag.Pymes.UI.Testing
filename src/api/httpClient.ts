import { apiConfig } from './apiConfig';
import { ApiHttpError } from './apiError';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;
type AccessTokenGetter = () => string | null | undefined;

export interface HttpRequestOptions {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
  query?: QueryParams;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface HttpResponseSnapshot {
  headers: Array<[string, string]>;
  ok: boolean;
  payload: unknown;
  requestUrl: string;
  status: number;
  statusText: string;
}

let accessTokenGetter: AccessTokenGetter | null = null;
let lastResponseStatus: number | null = null;

export function setAccessTokenGetter(getter: AccessTokenGetter | null) {
  accessTokenGetter = getter;
}

export function getLastResponseStatus() {
  return lastResponseStatus;
}

export function resolveApiUrl(path: string, query?: QueryParams) {
  if (!apiConfig.baseUrl) {
    throw new Error('VITE_RAGPYMES_API_BASE_URL is not configured.');
  }

  const baseUrl = /^https?:\/\//i.test(apiConfig.baseUrl)
    ? `${apiConfig.baseUrl}/`
    : new URL(apiConfig.baseUrl.replace(/^\//, ''), `${window.location.origin}/`).toString();
  const url = new URL(path.replace(/^\//, ''), baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function execute(method: HttpMethod, path: string, options: HttpRequestOptions = {}): Promise<HttpResponseSnapshot> {
  const requestSignal = createRequestSignal(options.signal, options.timeoutMs ?? apiConfig.timeoutMs);

  try {
    const body = options.body;
    const requestUrl = resolveApiUrl(path, options.query);
    const response = await fetch(requestUrl, {
      body: serializeBody(body),
      headers: buildHeaders(body, options.headers, options.auth ?? true),
      method,
      signal: requestSignal.signal,
    });

    lastResponseStatus = response.status;
    const payload = await parseResponse(response);

    return {
      headers: Array.from(response.headers.entries()),
      ok: response.ok,
      payload,
      requestUrl,
      status: response.status,
      statusText: response.statusText,
    };
  } finally {
    requestSignal.cleanup();
  }
}

async function request<T>(method: HttpMethod, path: string, options: HttpRequestOptions = {}) {
  const response = await execute(method, path, options);

  if (!response.ok) {
    throw new ApiHttpError(response.status, response.statusText, response.payload);
  }

  return response.payload as T;
}

function createRequestSignal(externalSignal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);

  if (externalSignal?.aborted) {
    controller.abort(externalSignal.reason);
  } else {
    externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });
  }

  return {
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromExternalSignal);
    },
    signal: controller.signal,
  };
}

function buildHeaders(body: unknown, headers: HeadersInit | undefined, auth: boolean) {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }

  if (body !== undefined && body !== null && shouldSendJsonContentType(body) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth && accessTokenGetter) {
    const token = accessTokenGetter();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  return requestHeaders;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    typeof body === 'string'
  ) {
    return body;
  }

  return JSON.stringify(body);
}

function shouldSendJsonContentType(body: unknown) {
  return !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob);
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

export const httpClient = {
  delete: <T>(path: string, options?: Omit<HttpRequestOptions, 'body'>) => request<T>('DELETE', path, options),
  execute,
  get: <T>(path: string, options?: Omit<HttpRequestOptions, 'body'>) => request<T>('GET', path, options),
  patch: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  post: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
};

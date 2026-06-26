import apiDefinition from '../../api-definition/RagPymes-v1.json';
import type { OpenApiDocument } from '../types/openapi';

const apiDocument = apiDefinition as OpenApiDocument;

const defaultBaseUrl =
  import.meta.env.VITE_RAGPYMES_API_BASE_URL ??
  apiDocument.servers?.[0]?.url ??
  'http://localhost:5088/';

const defaultTimeoutMs = parsePositiveInteger(import.meta.env.VITE_RAGPYMES_API_TIMEOUT_MS, 30000);

let runtimeBaseUrl = normalizeBaseUrl(defaultBaseUrl);
let runtimeTimeoutMs = defaultTimeoutMs;

export const apiConfig = {
  get baseUrl() {
    return runtimeBaseUrl;
  },
  get timeoutMs() {
    return runtimeTimeoutMs;
  },
};

export function hasConfiguredApi() {
  return apiConfig.baseUrl.trim().length > 0;
}

export function setApiBaseUrl(baseUrl: string) {
  runtimeBaseUrl = normalizeBaseUrl(baseUrl);
}

export function setApiTimeoutMs(timeoutMs: number) {
  runtimeTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : defaultTimeoutMs;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '');
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

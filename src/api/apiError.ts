export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | string | null;
  detail?: string | null;
  instance?: string | null;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ApiHttpError extends Error {
  public readonly payload: unknown;
  public readonly problem: ProblemDetails | null;
  public readonly status: number;
  public readonly statusText: string;

  constructor(status: number, statusText: string, payload: unknown) {
    const problem = parseProblemDetails(payload);

    super(getApiErrorMessage(status, statusText, payload, problem));
    this.name = 'ApiHttpError';
    this.status = status;
    this.statusText = statusText;
    this.payload = payload;
    this.problem = problem;
  }
}

export function parseProblemDetails(payload: unknown): ProblemDetails | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as ProblemDetails;
  if (
    'title' in candidate ||
    'detail' in candidate ||
    'status' in candidate ||
    'type' in candidate ||
    'extensions' in candidate
  ) {
    return candidate;
  }

  return null;
}

export function getApiErrorMessage(
  status: number,
  statusText: string,
  payload: unknown,
  problem: ProblemDetails | null = parseProblemDetails(payload),
) {
  const errorCode = getProblemErrorCode(problem);
  const title = asText(problem?.title);
  const detail = asText(problem?.detail);
  const fallback = statusText || 'HTTP error';

  return [errorCode, title || fallback, detail].filter(Boolean).join(' - ') || `HTTP ${status}`;
}

export function getProblemErrorCode(problem: ProblemDetails | null) {
  const extensionCode = problem?.extensions?.errorCode;
  const directCode = problem?.errorCode;

  return asText(extensionCode ?? directCode);
}

function asText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

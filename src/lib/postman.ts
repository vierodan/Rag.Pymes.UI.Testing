import type { ApiEndpoint, CollectionVariable, EndpointField, HttpMethod } from '../types/postman';

interface PostmanCollection {
  info?: {
    name?: string;
    description?: string;
  };
  variable?: Array<{
    key?: string;
    value?: string;
    description?: string;
  }>;
  item?: PostmanItem[];
}

interface PostmanItem {
  name?: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
}

interface PostmanRequest {
  method?: string;
  description?: string;
  url?: {
    raw?: string;
    variable?: PostmanField[];
    query?: PostmanField[];
  };
  header?: PostmanField[];
  auth?: {
    type?: string;
  };
  body?: {
    mode?: string;
    raw?: string;
    formdata?: PostmanField[];
  };
}

interface PostmanField {
  key?: string;
  value?: string;
  description?: string;
  type?: string;
  disabled?: boolean;
}

export interface ApiCatalog {
  name: string;
  description: string;
  variables: CollectionVariable[];
  endpoints: ApiEndpoint[];
}

export function buildCatalog(collection: PostmanCollection): ApiCatalog {
  const endpoints: ApiEndpoint[] = [];

  function walk(items: PostmanItem[] = [], group: string[] = []) {
    for (const item of items) {
      if (item.item) {
        walk(item.item, [...group, item.name ?? 'unnamed']);
        continue;
      }

      const request = item.request;
      const method = asHttpMethod(request?.method);
      if (!method || !request?.url?.raw) {
        continue;
      }

      const description = cleanText(request.description);
      const auth = request.auth?.type ?? null;

      endpoints.push({
        id: slugify([...group, item.name ?? request.url.raw].join('-')),
        group,
        name: item.name ?? request.url.raw,
        description,
        method,
        path: normalizePath(request.url.raw),
        openApiPath: toOpenApiPath(normalizePath(request.url.raw)),
        pathVariables: inferPathVariables(request.url.raw, request.url.variable),
        query: asEnabledFields(request.url.query),
        headers: asEnabledFields(request.header),
        auth,
        requiresAuth: requiresAuth(auth, description),
        body: request.body
          ? {
              mode: request.body.mode ?? 'raw',
              raw: request.body.raw ? cleanText(request.body.raw) : undefined,
              formdata: asEnabledFields(request.body.formdata),
            }
          : null,
      });
    }
  }

  walk(collection.item);

  return {
    name: collection.info?.name ?? 'RagPymes API',
    description: cleanText(collection.info?.description),
    variables: (collection.variable ?? []).map((variable) => ({
      key: variable.key ?? '',
      value: variable.value ?? '',
      description: cleanText(variable.description),
    })),
    endpoints,
  };
}

export function resolveTemplateValue(value: string, variables: Record<string, string>) {
  return value.replace(/\{\{([^}]+)}}/g, (_, key: string) => variables[key] ?? '');
}

function normalizePath(rawUrl: string) {
  return rawUrl.replace('{{baseUrl}}', '').replace(/^https?:\/\/[^/]+/i, '').replace(/\/{2,}/g, '/');
}

function toOpenApiPath(path: string) {
  return path.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '{$1}');
}

function inferPathVariables(rawUrl: string, declared: PostmanField[] = []) {
  const declaredByKey = new Map(declared.map((field) => [field.key, field]));
  const matches = Array.from(rawUrl.matchAll(/:([A-Za-z][A-Za-z0-9_]*)/g));

  return matches.map((match) => {
    const key = match[1];
    const field = declaredByKey.get(key);

    return {
      key,
      value: field?.value ?? `{{${key}}}`,
      description: cleanText(field?.description),
      type: field?.type,
    };
  });
}

function asEnabledFields(fields: PostmanField[] = []): EndpointField[] {
  return fields
    .filter((field) => !field.disabled && field.key)
    .map((field) => ({
      key: field.key ?? '',
      value: field.value ?? '',
      description: cleanText(field.description),
      type: field.type,
    }));
}

function requiresAuth(auth: string | null, description: string) {
  const normalized = description.toLowerCase();
  if (normalized.includes('no requiere autenticacion')) {
    return false;
  }

  return (
    auth === 'oauth2' ||
    normalized.includes('requiere token') ||
    normalized.includes('requiere permisos') ||
    normalized.includes('requiere la identidad')
  );
}

function cleanText(value?: string) {
  return (value ?? '').replace(/\r\n/g, '\n').trim();
}

function asHttpMethod(method?: string): HttpMethod | null {
  const normalized = method?.toUpperCase();
  const supported = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  return supported.includes(normalized ?? '') ? (normalized as HttpMethod) : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

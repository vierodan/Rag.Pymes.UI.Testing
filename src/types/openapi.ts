import type { HttpMethod } from './postman';

export interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  servers?: Array<{ url: string }>;
  paths: Record<string, Partial<Record<Lowercase<HttpMethod>, OpenApiOperation>>>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

export interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: Record<string, { schema?: OpenApiSchemaRef }>;
    required?: boolean;
  };
  responses?: Record<string, OpenApiResponse>;
}

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: OpenApiSchemaRef;
}

export interface OpenApiResponse {
  description?: string;
  content?: Record<string, { schema?: OpenApiSchemaRef }>;
}

export interface OpenApiSchemaRef {
  $ref?: string;
  type?: string | string[];
  format?: string;
  default?: unknown;
  properties?: Record<string, OpenApiSchemaRef>;
  required?: string[];
  additionalProperties?: boolean | OpenApiSchemaRef;
}

export interface OperationContract {
  operationId: string;
  tags: string[];
  summary: string;
  description: string;
  requestContentTypes: string[];
  requestSchemaNames: string[];
  responseCodes: string[];
  responseSchemaNames: string[];
  requiredPathParams: string[];
  requiredQueryParams: string[];
}

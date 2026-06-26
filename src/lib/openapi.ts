import type { HttpMethod } from '../types/postman';
import type { OpenApiDocument, OpenApiOperation, OperationContract } from '../types/openapi';

export function buildOpenApiContractIndex(document: OpenApiDocument) {
  const index = new Map<string, OperationContract>();

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of Object.keys(pathItem) as Array<Lowercase<HttpMethod>>) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }

      index.set(`${method.toUpperCase()} ${path}`, toContract(operation));
    }
  }

  return index;
}

function toContract(operation: OpenApiOperation): OperationContract {
  const requestContent = operation.requestBody?.content ?? {};
  const responses = operation.responses ?? {};
  const parameters = operation.parameters ?? [];

  return {
    operationId: operation.operationId ?? '',
    tags: operation.tags ?? [],
    summary: operation.summary ?? '',
    description: operation.description ?? '',
    requestContentTypes: Object.keys(requestContent),
    requestSchemaNames: Object.values(requestContent).map((content) => schemaName(content.schema)).filter(Boolean),
    responseCodes: Object.keys(responses),
    responseSchemaNames: unique(
      Object.values(responses).flatMap((response) =>
        Object.values(response.content ?? {}).map((content) => schemaName(content.schema)).filter(Boolean),
      ),
    ),
    requiredPathParams: parameters
      .filter((parameter) => parameter.in === 'path' && parameter.required)
      .map((parameter) => parameter.name),
    requiredQueryParams: parameters
      .filter((parameter) => parameter.in === 'query' && parameter.required)
      .map((parameter) => parameter.name),
  };
}

function schemaName(schema?: { $ref?: string }) {
  return schema?.$ref?.split('/').at(-1) ?? '';
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

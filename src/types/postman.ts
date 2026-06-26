export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface CollectionVariable {
  key: string;
  value: string;
  description: string;
}

export interface EndpointField {
  key: string;
  value: string;
  description: string;
  type?: string;
}

export interface EndpointBody {
  mode: 'raw' | 'formdata' | string;
  raw?: string;
  formdata: EndpointField[];
}

export interface ApiEndpoint {
  id: string;
  group: string[];
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  openApiPath: string;
  pathVariables: EndpointField[];
  query: EndpointField[];
  headers: EndpointField[];
  auth: string | null;
  requiresAuth: boolean;
  body: EndpointBody | null;
}

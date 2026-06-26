export type ConnectionState = 'idle' | 'checking' | 'online' | 'offline' | 'invalid';

export interface ConnectionSummary {
  checkedAt?: string;
  endpoint?: string;
  latencyMs?: number;
  message: string;
  state: ConnectionState;
  status?: number | null;
}

export interface ApiConnectionSettings {
  baseUrl: string;
  bearerToken: string;
}

export type UpdateApiConnectionSettings = (updates: Partial<ApiConnectionSettings>) => void;

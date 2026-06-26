export type ConnectionState = 'idle' | 'checking' | 'online' | 'offline' | 'invalid';

export interface ConnectionSummary {
  checkedAt?: string;
  endpoint?: string;
  latencyMs?: number;
  message: string;
  state: ConnectionState;
  status?: number | null;
}

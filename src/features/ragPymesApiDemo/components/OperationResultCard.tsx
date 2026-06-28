import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import type { NormalizedApiError } from './apiResultUtils';
import styles from './OperationResultCard.module.css';

export interface OperationResult {
  error?: NormalizedApiError;
  extra?: ReactNode;
  latencyMs: number;
  payload?: unknown;
  status: number | null;
  state: 'success' | 'error';
}

interface OperationResultCardProps {
  idleMessage: string;
  onClearResult?: () => void;
  result?: OperationResult;
  title?: string;
}

export function OperationResultCard({
  idleMessage,
  onClearResult,
  result,
  title = 'Resultado',
}: OperationResultCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeMenu = () => setContextMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('click', closeMenu);
    window.addEventListener('contextmenu', closeMenu);
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('contextmenu', closeMenu);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [contextMenu]);

  if (!result) {
    return (
      <div className={styles.noticeBox}>
        <strong>Sin ejecutar todavía</strong>
        <p>{idleMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.resultCard} data-state={result.state}>
      <div className={styles.header}>
        <strong>{title}</strong>
        <div className={styles.meta}>
          <span>HTTP {result.status ?? '-'}</span>
          <span>{result.latencyMs} ms</span>
        </div>
      </div>

      {result.error ? (
        <div className={styles.errorBox}>
          <strong>{result.error.name}</strong>
          <p>{result.error.message}</p>
          {result.error.detail ? <p>{result.error.detail}</p> : null}
        </div>
      ) : null}

      {result.extra}

      <JsonPayload
        onClearResult={
          onClearResult
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                setContextMenu({ x: event.clientX, y: event.clientY });
              }
            : undefined
        }
        value={result.error?.problem ?? result.payload}
      />

      {contextMenu && onClearResult ? (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              onClearResult();
            }}
          >
            Borrar resultado
          </button>
        </div>
      ) : null}
    </div>
  );
}

function JsonPayload({
  onClearResult,
  value,
}: {
  onClearResult?: (event: MouseEvent<HTMLPreElement>) => void;
  value: unknown;
}) {
  const payload = normalizePayload(value);

  if (payload === undefined) {
    return (
      <pre className={styles.payload} onContextMenu={onClearResult}>
        La operación no devolvió contenido.
      </pre>
    );
  }

  return (
    <pre className={styles.payload} onContextMenu={onClearResult}>
      {renderHighlightedJson(formatJson(payload))}
    </pre>
  );
}

function normalizePayload(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function formatJson(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderHighlightedJson(json: string) {
  const tokenPattern = /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(json)) !== null) {
    if (match.index > cursor) {
      nodes.push(json.slice(cursor, match.index));
    }

    const [token, key, stringValue, numberValue, booleanValue, nullValue] = match;
    const className = key
      ? styles.jsonKey
      : stringValue
        ? styles.jsonString
        : numberValue
          ? styles.jsonNumber
          : booleanValue
            ? styles.jsonBoolean
            : nullValue
              ? styles.jsonNull
              : undefined;

    nodes.push(
      <span className={className} key={`${token}-${index}`}>
        {token}
      </span>,
    );
    cursor = match.index + token.length;
    index += 1;
  }

  if (cursor < json.length) {
    nodes.push(json.slice(cursor));
  }

  return nodes;
}

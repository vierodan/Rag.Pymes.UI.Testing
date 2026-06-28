import styles from './ApiActionButton.module.css';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';

interface ApiActionButtonProps {
  disabled?: boolean;
  method: HttpMethod;
  onClick?: () => void;
  path: string;
  type?: 'button' | 'submit';
}

const methodClassName: Record<HttpMethod, string> = {
  DELETE: styles.deleteButton,
  GET: styles.getButton,
  HEAD: styles.getButton,
  OPTIONS: styles.getButton,
  PATCH: styles.patchButton,
  POST: styles.postButton,
  PUT: styles.patchButton,
};

export function ApiActionButton({ disabled = false, method, onClick, path, type = 'button' }: ApiActionButtonProps) {
  const tooltip = `${method} ${path}`;

  return (
    <span className={styles.wrap}>
      <button
        aria-label={tooltip}
        className={`${styles.button} ${methodClassName[method]}`}
        disabled={disabled}
        onClick={onClick}
        type={type}
      >
        Ejecutar
      </button>
      <span className={styles.tooltip} role="tooltip">
        {tooltip}
      </span>
    </span>
  );
}

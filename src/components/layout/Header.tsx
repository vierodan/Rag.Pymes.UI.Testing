import type { ConnectionSummary } from '../../types/connection';
import styles from './Header.module.css';

interface HeaderProps {
  connectionSummary: ConnectionSummary;
  endpointCount: number;
  openApiVersion: string;
}

export function Header({ connectionSummary, endpointCount, openApiVersion }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>RP</div>
        <div>
          <p className={styles.kicker}>Testing console</p>
          <h1 className={styles.title}>RagPymes API Testing SPA</h1>
        </div>
      </div>

      <div className={styles.meta} aria-label="API contract status">
        <span className={styles.status}>OpenAPI {openApiVersion}</span>
        <span className={styles.connection} data-connection-badge data-state={connectionSummary.state}>
          Conexion: {connectionLabel[connectionSummary.state]}
          {connectionSummary.status ? ` · HTTP ${connectionSummary.status}` : ''}
        </span>
        <span className={styles.endpoint}>{endpointCount} endpoints documentados</span>
      </div>
    </header>
  );
}

const connectionLabel = {
  checking: 'comprobando',
  idle: 'sin comprobar',
  invalid: 'URL invalida',
  offline: 'sin conexion',
  online: 'online',
};

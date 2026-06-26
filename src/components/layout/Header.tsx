import styles from './Header.module.css';

interface HeaderProps {
  endpointCount: number;
  openApiVersion: string;
}

export function Header({ endpointCount, openApiVersion }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>RP</div>
        <div>
          <p className={styles.kicker}>Frontend foundation</p>
          <h1 className={styles.title}>RagPymes API Testing SPA</h1>
        </div>
      </div>

      <div className={styles.meta} aria-label="API contract status">
        <span className={styles.status}>OpenAPI {openApiVersion}</span>
        <span className={styles.endpoint}>{endpointCount} endpoints documentados</span>
      </div>
    </header>
  );
}

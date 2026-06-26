import type { PropsWithChildren } from 'react';
import styles from './AppShell.module.css';

export function AppShell({ children }: PropsWithChildren) {
  return <div className={styles.shell}>{children}</div>;
}

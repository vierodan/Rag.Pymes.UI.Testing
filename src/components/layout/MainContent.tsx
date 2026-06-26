import type { PropsWithChildren } from 'react';
import styles from './MainContent.module.css';

export function MainContent({ children }: PropsWithChildren) {
  return <main className={styles.main}>{children}</main>;
}

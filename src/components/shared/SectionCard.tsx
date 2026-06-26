import type { PropsWithChildren } from 'react';
import styles from './SectionCard.module.css';

interface SectionCardProps extends PropsWithChildren {
  description?: string;
  eyebrow?: string;
  title: string;
}

export function SectionCard({ children, description, eyebrow, title }: SectionCardProps) {
  return (
    <section className={styles.card}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

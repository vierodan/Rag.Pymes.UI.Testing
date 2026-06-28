import styles from './EndpointStepTitle.module.css';

interface EndpointStepTitleProps {
  path: string;
  title: string;
}

export function EndpointStepTitle({ path, title }: EndpointStepTitleProps) {
  return (
    <h4 className={styles.title}>
      <span>{title}</span> <span className={styles.path}>[{path}]</span>
    </h4>
  );
}

import styles from './FeatureExplainerCards.module.css';

interface HowToCard {
  hint?: string;
  steps: string[];
}

interface WhatCard {
  description: string;
  fields?: string[];
  response: string[];
  rules?: string[];
}

export interface FeatureExplainerCardsProps {
  ariaLabel: string;
  howTo: HowToCard;
  what: WhatCard;
}

export function FeatureExplainerCards({ ariaLabel, howTo, what }: FeatureExplainerCardsProps) {
  return (
    <section aria-label={ariaLabel} className={styles.cards}>
      <aside className={`${styles.card} ${styles.howToCard}`}>
        <h3>Cómo probar esta sección</h3>
        <ol>
          {howTo.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {howTo.hint ? <p>{howTo.hint}</p> : null}
      </aside>

      <aside className={`${styles.card} ${styles.whatCard}`}>
        <div className={styles.block}>
          <h3>¿Qué hace?</h3>
          <p>{what.description}</p>
        </div>

        {what.fields && what.fields.length > 0 ? (
          <div className={styles.block}>
            <h4>Campos y valores válidos</h4>
            <ul>
              {what.fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {what.rules && what.rules.length > 0 ? (
          <div className={styles.block}>
            <h4>Reglas útiles</h4>
            <ul>
              {what.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.block}>
          <h4>¿Qué devuelve?</h4>
          <ul>
            {what.response.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}

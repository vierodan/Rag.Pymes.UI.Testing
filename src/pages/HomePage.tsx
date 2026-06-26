import { RagPymesApiDemo } from '../features/ragPymesApiDemo/components/RagPymesApiDemo';
import styles from './HomePage.module.css';

const contractHighlights = [
  'OpenAPI define 34 operaciones y la coleccion Postman aporta ejemplos ejecutables.',
  'El backend en ../rag-pymes-backend/ es contexto de solo lectura para validar contratos.',
  'Los flujos principales cubren tenants, invitaciones, knowledge bases, documentos, ingestion y RAG.',
];

const roadmapItems = [
  'Convertir health checks y conexion en un panel guiado.',
  'Crear workbenches especificos para Access Management y Knowledge.',
  'Mantener el endpoint explorer como herramienta avanzada para operaciones no guiadas.',
];

export function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>API demo</p>
          <h2 className={styles.heroTitle}>Una UI guiada para probar RagPymes sin inventar contratos.</h2>
          <p className={styles.heroLead}>
            La SPA combina la definicion OpenAPI local con la coleccion Postman documentada para ejecutar pruebas reales
            contra la API y preparar flujos de demo por dominio.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div>
            <span className={styles.statValue}>OpenAPI-first</span>
            <span className={styles.statLabel}>contrato formal en api-definition/RagPymes-v1.json</span>
          </div>
          <div>
            <span className={styles.statValue}>Postman examples</span>
            <span className={styles.statLabel}>bodies, variables y descripciones operativas desde la coleccion</span>
          </div>
          <div>
            <span className={styles.statValue}>HTTP real</span>
            <span className={styles.statLabel}>base URL configurable y Bearer token opcional para endpoints protegidos</span>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <section className={styles.infoCard}>
          <p className={styles.cardEyebrow}>Contrato</p>
          <h3>Lo que expone la API</h3>
          <ul>
            {contractHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.infoCard}>
          <p className={styles.cardEyebrow}>Siguiente paso</p>
          <h3>Como crecera esta demo</h3>
          <ul>
            {roadmapItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </section>

      <RagPymesApiDemo />
    </div>
  );
}

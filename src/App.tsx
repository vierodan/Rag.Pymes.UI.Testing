import apiDefinition from '../api-definition/RagPymes-v1.json';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { MainContent } from './components/layout/MainContent';
import { HomePage } from './pages/HomePage';
import postmanCollection from './data/postmanCollection.json';
import { buildCatalog } from './lib/postman';
import type { OpenApiDocument } from './types/openapi';

const catalog = buildCatalog(postmanCollection);
const apiDocument = apiDefinition as OpenApiDocument;

export default function App() {
  return (
    <AppShell>
      <Header endpointCount={catalog.endpoints.length} openApiVersion={apiDocument.info.version} />
      <MainContent>
        <HomePage />
      </MainContent>
    </AppShell>
  );
}

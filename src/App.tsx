import { useState } from 'react';
import apiDefinition from '../api-definition/RagPymes-v1.json';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { MainContent } from './components/layout/MainContent';
import { HomePage } from './pages/HomePage';
import postmanCollection from './data/postmanCollection.json';
import { buildCatalog } from './lib/postman';
import type { ConnectionSummary } from './types/connection';
import type { OpenApiDocument } from './types/openapi';

const catalog = buildCatalog(postmanCollection);
const apiDocument = apiDefinition as OpenApiDocument;
const initialConnectionSummary: ConnectionSummary = {
  message: 'Sin comprobar',
  state: 'idle',
  status: null,
};

export default function App() {
  const [connectionSummary, setConnectionSummary] = useState<ConnectionSummary>(initialConnectionSummary);

  return (
    <AppShell>
      <Header
        connectionSummary={connectionSummary}
        endpointCount={catalog.endpoints.length}
        openApiVersion={apiDocument.info.version}
      />
      <MainContent>
        <HomePage onConnectionChange={setConnectionSummary} />
      </MainContent>
    </AppShell>
  );
}

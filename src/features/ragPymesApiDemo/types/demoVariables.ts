export interface SharedDemoVariables {
  documentId: string;
  ingestionRunId: string;
  invitationId: string;
  invitationToken: string;
  knowledgeBaseId: string;
  membershipId: string;
  tenantId: string;
}

export type UpdateSharedDemoVariables = (updates: Partial<SharedDemoVariables>) => void;

export const initialSharedDemoVariables: SharedDemoVariables = {
  documentId: '',
  ingestionRunId: '',
  invitationId: '',
  invitationToken: '',
  knowledgeBaseId: '',
  membershipId: '',
  tenantId: '',
};

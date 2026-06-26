import { httpClient } from './httpClient';
import type {
  AcceptTenantInvitationResponse,
  ChangeKnowledgeBaseGrantRoleRequest,
  ChangeKnowledgeBaseGrantRoleResponse,
  ChangeTenantMembershipRoleRequest,
  ChangeTenantMembershipRoleResponse,
  CreateKnowledgeBaseRequest,
  CreateKnowledgeBaseResponse,
  CreateTenantInvitationRequest,
  CreateTenantInvitationResponse,
  GenerateKnowledgeAnswerRequest,
  GenerateKnowledgeAnswerResponse,
  GetIngestionRunResponse,
  GetKnowledgeBaseResponse,
  GetKnowledgeDocumentResponse,
  GetTenantResponse,
  GrantKnowledgeBaseAccessRequest,
  GrantKnowledgeBaseAccessResponse,
  HealthResponse,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  ListDocumentIngestionRunsResponse,
  ListKnowledgeBaseGrantsResponse,
  ListKnowledgeBasesResponse,
  ListMyTenantsResponse,
  ListTenantInvitationsResponse,
  ListTenantMembershipsResponse,
  ListTenantsResponse,
  ProvisionTenantRequest,
  ProvisionTenantResponse,
  ReactivateTenantResponse,
  RegisterTenantRequest,
  RegisterTenantResponse,
  ReindexKnowledgeDocumentResponse,
  RevokeKnowledgeBaseGrantResponse,
  RevokeTenantInvitationResponse,
  SuspendTenantResponse,
  UploadKnowledgeDocumentResponse,
  Uuid,
} from './contracts';

export const ragPymesApi = {
  accessManagement: {
    acceptTenantInvitation: (token: string) =>
      httpClient.post<AcceptTenantInvitationResponse>(`/api/v1/invitations/${encodePath(token)}/accept`),

    changeKnowledgeBaseGrantRole: (
      tenantId: Uuid,
      knowledgeBaseId: Uuid,
      grantId: Uuid,
      body: ChangeKnowledgeBaseGrantRoleRequest,
    ) =>
      httpClient.patch<ChangeKnowledgeBaseGrantRoleResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/grants/${encodePath(grantId)}`,
        body,
      ),

    changeTenantMembershipRole: (tenantId: Uuid, membershipId: Uuid, body: ChangeTenantMembershipRoleRequest) =>
      httpClient.patch<ChangeTenantMembershipRoleResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/memberships/${encodePath(membershipId)}/role`,
        body,
      ),

    createTenantInvitation: (tenantId: Uuid, body: CreateTenantInvitationRequest) =>
      httpClient.post<CreateTenantInvitationResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/invitations`,
        body,
      ),

    getTenant: (tenantId: Uuid) =>
      httpClient.get<GetTenantResponse>(`/api/v1/tenants/${encodePath(tenantId)}`),

    grantKnowledgeBaseAccess: (tenantId: Uuid, knowledgeBaseId: Uuid, body: GrantKnowledgeBaseAccessRequest) =>
      httpClient.post<GrantKnowledgeBaseAccessResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/grants`,
        body,
      ),

    listKnowledgeBaseGrants: (tenantId: Uuid, knowledgeBaseId: Uuid) =>
      httpClient.get<ListKnowledgeBaseGrantsResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/grants`,
      ),

    listMyTenants: () => httpClient.get<ListMyTenantsResponse>('/api/v1/me/tenants'),

    listTenantInvitations: (tenantId: Uuid) =>
      httpClient.get<ListTenantInvitationsResponse>(`/api/v1/tenants/${encodePath(tenantId)}/invitations`),

    listTenantMemberships: (tenantId: Uuid) =>
      httpClient.get<ListTenantMembershipsResponse>(`/api/v1/tenants/${encodePath(tenantId)}/memberships`),

    listTenants: () => httpClient.get<ListTenantsResponse>('/api/v1/tenants'),

    provisionTenant: (body: ProvisionTenantRequest) =>
      httpClient.post<ProvisionTenantResponse>('/api/v1/tenants', body),

    registerTenant: (body: RegisterTenantRequest) =>
      httpClient.post<RegisterTenantResponse>('/api/v1/tenant-registrations', body),

    revokeKnowledgeBaseGrant: (tenantId: Uuid, knowledgeBaseId: Uuid, grantId: Uuid) =>
      httpClient.delete<RevokeKnowledgeBaseGrantResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/grants/${encodePath(grantId)}`,
      ),

    revokeTenantInvitation: (tenantId: Uuid, invitationId: Uuid) =>
      httpClient.delete<RevokeTenantInvitationResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/invitations/${encodePath(invitationId)}`,
      ),

    revokeTenantMembership: (tenantId: Uuid, membershipId: Uuid) =>
      httpClient.delete<null>(`/api/v1/tenants/${encodePath(tenantId)}/memberships/${encodePath(membershipId)}`),

    suspendTenant: (tenantId: Uuid) =>
      httpClient.post<SuspendTenantResponse>(`/api/v1/tenants/${encodePath(tenantId)}/suspensions`),
  },

  health: {
    getHealth: () => httpClient.get<HealthResponse>('/health', { auth: false }),
    getLiveHealth: () => httpClient.get<HealthResponse>('/health/live', { auth: false }),
    getReadyHealth: () => httpClient.get<HealthResponse>('/health/ready', { auth: false }),
  },

  knowledge: {
    createKnowledgeBase: (tenantId: Uuid, body: CreateKnowledgeBaseRequest) =>
      httpClient.post<CreateKnowledgeBaseResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases`,
        body,
      ),

    deleteKnowledgeDocument: (tenantId: Uuid, knowledgeBaseId: Uuid, documentId: Uuid) =>
      httpClient.delete<null>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/documents/${encodePath(documentId)}`,
      ),

    generateKnowledgeAnswer: (tenantId: Uuid, knowledgeBaseId: Uuid, body: GenerateKnowledgeAnswerRequest) =>
      httpClient.post<GenerateKnowledgeAnswerResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/answers`,
        body,
      ),

    getIngestionRun: (tenantId: Uuid, knowledgeBaseId: Uuid, documentId: Uuid, ingestionRunId: Uuid) =>
      httpClient.get<GetIngestionRunResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/documents/${encodePath(documentId)}/ingestion-runs/${encodePath(ingestionRunId)}`,
      ),

    getKnowledgeBase: (tenantId: Uuid, knowledgeBaseId: Uuid) =>
      httpClient.get<GetKnowledgeBaseResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}`,
      ),

    getKnowledgeDocument: (tenantId: Uuid, knowledgeBaseId: Uuid, documentId: Uuid) =>
      httpClient.get<GetKnowledgeDocumentResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/documents/${encodePath(documentId)}`,
      ),

    listDocumentIngestionRuns: (tenantId: Uuid, knowledgeBaseId: Uuid, documentId: Uuid) =>
      httpClient.get<ListDocumentIngestionRunsResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/documents/${encodePath(documentId)}/ingestion-runs`,
      ),

    listKnowledgeBases: (tenantId: Uuid) =>
      httpClient.get<ListKnowledgeBasesResponse>(`/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases`),

    reindexKnowledgeDocument: (tenantId: Uuid, knowledgeBaseId: Uuid, documentId: Uuid) =>
      httpClient.post<ReindexKnowledgeDocumentResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/documents/${encodePath(documentId)}/reindexing-runs`,
      ),

    searchKnowledge: (tenantId: Uuid, knowledgeBaseId: Uuid, body: KnowledgeSearchRequest) =>
      httpClient.post<KnowledgeSearchResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/searches`,
        body,
      ),

    uploadKnowledgeDocument: (tenantId: Uuid, knowledgeBaseId: Uuid, file: File) => {
      const body = new FormData();
      body.append('file', file);

      return httpClient.post<UploadKnowledgeDocumentResponse>(
        `/api/v1/tenants/${encodePath(tenantId)}/knowledge-bases/${encodePath(knowledgeBaseId)}/documents`,
        body,
      );
    },
  },

  platformAdministration: {
    listPlatformTenants: () => httpClient.get<ListTenantsResponse>('/api/v1/platform/tenants'),

    reactivateTenant: (tenantId: Uuid) =>
      httpClient.post<ReactivateTenantResponse>(
        `/api/v1/platform/tenants/${encodePath(tenantId)}/reactivations`,
      ),

    suspendTenant: (tenantId: Uuid) =>
      httpClient.post<SuspendTenantResponse>(`/api/v1/platform/tenants/${encodePath(tenantId)}/suspensions`),
  },
};

function encodePath(value: string) {
  return encodeURIComponent(value);
}

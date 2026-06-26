export type Uuid = string;
export type DateTime = string;
export type IntegerString = number | string;
export type Nullable<T> = T | null;
export type StringMap = Record<string, string>;

export interface HealthCheckEntryResponse {
  description: Nullable<string>;
  status: string;
}

export interface HealthResponse {
  entries: Record<string, HealthCheckEntryResponse>;
  status: string;
}

export interface TenantDto {
  createdAt: DateTime;
  id: Uuid;
  name: string;
  slug: string;
  status: string;
  suspendedAt: Nullable<DateTime>;
  version: IntegerString;
}

export interface MyTenantDto {
  membershipStatus: string;
  name: string;
  role: string;
  slug: Nullable<string>;
  status: string;
  tenantId: Uuid;
}

export interface TenantMembershipDto {
  activatedAt: Nullable<DateTime>;
  createdAt: DateTime;
  id: Uuid;
  revokedAt: Nullable<DateTime>;
  role: string;
  status: string;
  subjectId: string;
  suspendedAt: Nullable<DateTime>;
  tenantId: Uuid;
  version: IntegerString;
}

export interface TenantInvitationDto {
  acceptedAt: Nullable<DateTime>;
  createdAt: DateTime;
  email: string;
  expiresAt: DateTime;
  id: Uuid;
  revokedAt: Nullable<DateTime>;
  role: string;
  status: string;
  tenantId: Uuid;
  version: IntegerString;
}

export interface KnowledgeBaseGrantDto {
  createdAt: DateTime;
  id: Uuid;
  knowledgeBaseId: Uuid;
  revokedAt: Nullable<DateTime>;
  role: string;
  roleChangedAt: Nullable<DateTime>;
  status: string;
  tenantId: Uuid;
  tenantMembershipId: Uuid;
  version: IntegerString;
}

export interface KnowledgeBaseDto {
  archivedAt: Nullable<DateTime>;
  createdAt: DateTime;
  description: Nullable<string>;
  id: Uuid;
  isArchived: boolean;
  name: string;
  tenantId: Uuid;
}

export interface KnowledgeDocumentDto {
  contentType: string;
  deletedAt: Nullable<DateTime>;
  fileName: string;
  id: Uuid;
  knowledgeBaseId: Uuid;
  sizeInBytes: IntegerString;
  status: string;
  tenantId: Uuid;
  uploadedAt: DateTime;
}

export interface IngestionRunDto {
  completedAt: Nullable<DateTime>;
  createdAt: DateTime;
  documentId: Uuid;
  embeddingDimensions: Nullable<IntegerString>;
  embeddingModel: Nullable<string>;
  embeddingProvider: Nullable<string>;
  errorCode: Nullable<string>;
  errorMessage: Nullable<string>;
  id: Uuid;
  startedAt: Nullable<DateTime>;
  status: string;
  tenantId: Uuid;
}

export interface KnowledgeSearchResultDto {
  chunkId: Uuid;
  content: string;
  documentFileName: string;
  documentId: Uuid;
  metadata?: Nullable<StringMap>;
  score: number | string;
  tenantId: Uuid;
}

export interface KnowledgeAnswerCitationDto {
  chunkId: Uuid;
  documentFileName: string;
  documentId: Uuid;
  metadata?: Nullable<StringMap>;
  referenceNumber: IntegerString;
  score: number | string;
  snippet: string;
}

export interface RegisterTenantRequest {
  companyName: string;
  contactEmail?: Nullable<string>;
  slug?: Nullable<string>;
}

export interface RegisterTenantResponse {
  ownerMembership: TenantMembershipDto;
  tenant: TenantDto;
}

export interface ProvisionTenantRequest {
  name: string;
  ownerExternalSubject: string;
  ownerIssuer: string;
}

export interface ProvisionTenantResponse {
  ownerMembership: TenantMembershipDto;
  tenant: TenantDto;
}

export interface ListTenantsResponse {
  tenants: TenantDto[];
}

export interface ListMyTenantsResponse {
  tenants: MyTenantDto[];
}

export interface GetTenantResponse {
  tenant: TenantDto;
}

export interface SuspendTenantResponse {
  tenant: TenantDto;
}

export interface ReactivateTenantResponse {
  tenant: TenantDto;
}

export interface CreateTenantInvitationRequest {
  email: string;
  role: string;
}

export interface CreateTenantInvitationResponse {
  invitation: TenantInvitationDto;
  invitationToken: string;
}

export interface ListTenantInvitationsResponse {
  invitations: TenantInvitationDto[];
}

export interface AcceptTenantInvitationResponse {
  invitation: TenantInvitationDto;
  membership: TenantMembershipDto;
}

export interface RevokeTenantInvitationResponse {
  invitation: TenantInvitationDto;
}

export interface ListTenantMembershipsResponse {
  memberships: TenantMembershipDto[];
}

export interface ChangeTenantMembershipRoleRequest {
  role: string;
}

export interface ChangeTenantMembershipRoleResponse {
  membership: TenantMembershipDto;
}

export interface GrantKnowledgeBaseAccessRequest {
  role: string;
  tenantMembershipId: Uuid;
}

export interface GrantKnowledgeBaseAccessResponse {
  grant: KnowledgeBaseGrantDto;
}

export interface ListKnowledgeBaseGrantsResponse {
  grants: KnowledgeBaseGrantDto[];
}

export interface ChangeKnowledgeBaseGrantRoleRequest {
  role: string;
}

export interface ChangeKnowledgeBaseGrantRoleResponse {
  grant: KnowledgeBaseGrantDto;
}

export interface RevokeKnowledgeBaseGrantResponse {
  grant: KnowledgeBaseGrantDto;
}

export interface CreateKnowledgeBaseRequest {
  description?: Nullable<string>;
  name: string;
}

export interface CreateKnowledgeBaseResponse {
  knowledgeBase: KnowledgeBaseDto;
}

export interface ListKnowledgeBasesResponse {
  knowledgeBases: KnowledgeBaseDto[];
}

export interface GetKnowledgeBaseResponse {
  knowledgeBase: KnowledgeBaseDto;
}

export interface UploadKnowledgeDocumentResponse {
  document: KnowledgeDocumentDto;
  ingestionRun: IngestionRunDto;
}

export interface GetKnowledgeDocumentResponse {
  document: KnowledgeDocumentDto;
  latestIngestionRun: Nullable<IngestionRunDto>;
}

export interface ReindexKnowledgeDocumentResponse {
  document: KnowledgeDocumentDto;
  ingestionRun: IngestionRunDto;
}

export interface ListDocumentIngestionRunsResponse {
  ingestionRuns: IngestionRunDto[];
}

export interface GetIngestionRunResponse {
  ingestionRun: IngestionRunDto;
}

export interface KnowledgeSearchRequest {
  filters?: Nullable<StringMap>;
  query: string;
  topK?: IntegerString;
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResultDto[];
}

export interface GenerateKnowledgeAnswerRequest {
  filters?: Nullable<StringMap>;
  question: string;
  topK?: IntegerString;
}

export interface GenerateKnowledgeAnswerResponse {
  answer: string;
  citations: KnowledgeAnswerCitationDto[];
  metadata?: Nullable<StringMap>;
  model?: Nullable<string>;
}

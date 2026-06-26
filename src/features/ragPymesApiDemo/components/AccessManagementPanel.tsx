import { useState, type ReactNode } from 'react';
import { getLastResponseStatus } from '../../../api/httpClient';
import { ragPymesApi } from '../../../api/ragPymesApi';
import type {
  CreateTenantInvitationRequest,
  ProvisionTenantRequest,
  RegisterTenantRequest,
} from '../../../api/contracts';
import { formatPayload, normalizeApiError, type NormalizedApiError } from './apiResultUtils';
import styles from './AccessManagementPanel.module.css';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type TenantRole = 'TenantOwner' | 'TenantAdmin' | 'TenantMember';

interface ActionMeta {
  endpoint: string;
  method: HttpMethod;
  operationId: string;
}

interface ActionResult {
  captured: Partial<SharedVariables>;
  error?: NormalizedApiError;
  latencyMs: number;
  meta: ActionMeta;
  payload?: unknown;
  status: number | null;
  state: 'success' | 'error';
}

interface SharedVariables {
  invitationId: string;
  invitationToken: string;
  membershipId: string;
  tenantId: string;
}

const tenantRoles: TenantRole[] = ['TenantOwner', 'TenantAdmin', 'TenantMember'];

const actions = {
  acceptTenantInvitation: {
    endpoint: '/api/v1/invitations/{token}/accept',
    method: 'POST',
    operationId: 'AcceptTenantInvitation',
  },
  changeTenantMembershipRole: {
    endpoint: '/api/v1/tenants/{tenantId}/memberships/{membershipId}/role',
    method: 'PATCH',
    operationId: 'ChangeTenantMembershipRole',
  },
  createTenantInvitation: {
    endpoint: '/api/v1/tenants/{tenantId}/invitations',
    method: 'POST',
    operationId: 'CreateTenantInvitation',
  },
  getTenant: {
    endpoint: '/api/v1/tenants/{tenantId}',
    method: 'GET',
    operationId: 'GetTenant',
  },
  listTenantInvitations: {
    endpoint: '/api/v1/tenants/{tenantId}/invitations',
    method: 'GET',
    operationId: 'ListTenantInvitations',
  },
  listTenantMemberships: {
    endpoint: '/api/v1/tenants/{tenantId}/memberships',
    method: 'GET',
    operationId: 'ListTenantMemberships',
  },
  listTenants: {
    endpoint: '/api/v1/tenants',
    method: 'GET',
    operationId: 'ListTenants',
  },
  provisionTenant: {
    endpoint: '/api/v1/tenants',
    method: 'POST',
    operationId: 'ProvisionTenant',
  },
  registerTenant: {
    endpoint: '/api/v1/tenant-registrations',
    method: 'POST',
    operationId: 'RegisterTenant',
  },
  revokeTenantInvitation: {
    endpoint: '/api/v1/tenants/{tenantId}/invitations/{invitationId}',
    method: 'DELETE',
    operationId: 'RevokeTenantInvitation',
  },
  revokeTenantMembership: {
    endpoint: '/api/v1/tenants/{tenantId}/memberships/{membershipId}',
    method: 'DELETE',
    operationId: 'RevokeTenantMembership',
  },
} satisfies Record<string, ActionMeta>;

const initialVariables: SharedVariables = {
  invitationId: '',
  invitationToken: '',
  membershipId: '',
  tenantId: '',
};

const initialRegisterForm = {
  companyName: 'Culebras S.A.',
  contactEmail: 'vierodan@culebras.com',
  slug: 'culebras',
};

const initialProvisionForm = {
  name: 'Empresa Demo',
  ownerExternalSubject: 'user-or-service-principal-subject',
  ownerIssuer: 'https://issuer.example.com',
};

const initialInvitationForm = {
  email: 'usuario@example.com',
  role: 'TenantMember' as TenantRole,
};

const initialMembershipForm = {
  role: 'TenantAdmin' as TenantRole,
};

export function AccessManagementPanel() {
  const [variables, setVariables] = useState<SharedVariables>(initialVariables);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [provisionForm, setProvisionForm] = useState(initialProvisionForm);
  const [invitationForm, setInvitationForm] = useState(initialInvitationForm);
  const [membershipForm, setMembershipForm] = useState(initialMembershipForm);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  async function runAction(meta: ActionMeta, action: () => Promise<unknown>) {
    setActiveOperationId(meta.operationId);
    const startedAt = performance.now();

    try {
      const payload = await action();
      const latencyMs = Math.round(performance.now() - startedAt);
      const captured = captureSharedVariables(payload);
      const status = getLastResponseStatus();

      if (Object.keys(captured).length > 0) {
        setVariables((current) => ({ ...current, ...captured }));
      }

      setResult({
        captured,
        latencyMs,
        meta,
        payload,
        status,
        state: 'success',
      });
    } catch (error) {
      const normalizedError = normalizeApiError(
        error,
        'Comprueba la base URL, el token Bearer y los permisos del actor autenticado.',
      );

      setResult({
        captured: {},
        error: normalizedError,
        latencyMs: Math.round(performance.now() - startedAt),
        meta,
        payload: normalizedError.problem,
        status: normalizedError.status ?? null,
        state: 'error',
      });
    } finally {
      setActiveOperationId(null);
    }
  }

  return (
    <div className={styles.panel}>
      <section className={styles.variablesPanel} aria-label="Variables compartidas">
        <div>
          <h3>Variables compartidas</h3>
          <p>Los IDs capturados se reutilizan en las siguientes acciones guiadas.</p>
        </div>
        <div className={styles.variableGrid}>
          <TextField
            label="tenantId"
            onChange={(value) => setVariables((current) => ({ ...current, tenantId: value }))}
            value={variables.tenantId}
          />
          <TextField
            label="membershipId"
            onChange={(value) => setVariables((current) => ({ ...current, membershipId: value }))}
            value={variables.membershipId}
          />
          <TextField
            label="invitationId"
            onChange={(value) => setVariables((current) => ({ ...current, invitationId: value }))}
            value={variables.invitationId}
          />
          <TextField
            label="invitationToken"
            onChange={(value) => setVariables((current) => ({ ...current, invitationToken: value }))}
            value={variables.invitationToken}
          />
        </div>
      </section>

      <div className={styles.flowGrid}>
        <FlowPanel title="Tenant onboarding">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Self-service. El actor sale del token; no envies issuer, subject ni roles."
            meta={actions.registerTenant}
            onRun={() =>
              runAction(actions.registerTenant, () =>
                ragPymesApi.accessManagement.registerTenant(toRegisterTenantRequest(registerForm)),
              )
            }
            title="Register tenant"
          >
            <div className={styles.formGrid}>
              <TextField
                label="companyName"
                onChange={(value) => setRegisterForm((current) => ({ ...current, companyName: value }))}
                value={registerForm.companyName}
              />
              <TextField
                label="slug"
                onChange={(value) => setRegisterForm((current) => ({ ...current, slug: value }))}
                value={registerForm.slug}
              />
              <TextField
                label="contactEmail"
                onChange={(value) => setRegisterForm((current) => ({ ...current, contactEmail: value }))}
                value={registerForm.contactEmail}
              />
            </div>
          </ActionBlock>

          <ActionBlock
            activeOperationId={activeOperationId}
            description="Provisioning tecnico atomico de tenant y primer owner."
            meta={actions.provisionTenant}
            onRun={() =>
              runAction(actions.provisionTenant, () =>
                ragPymesApi.accessManagement.provisionTenant(toProvisionTenantRequest(provisionForm)),
              )
            }
            title="Provision tenant"
          >
            <div className={styles.formGrid}>
              <TextField
                label="name"
                onChange={(value) => setProvisionForm((current) => ({ ...current, name: value }))}
                value={provisionForm.name}
              />
              <TextField
                label="ownerIssuer"
                onChange={(value) => setProvisionForm((current) => ({ ...current, ownerIssuer: value }))}
                value={provisionForm.ownerIssuer}
              />
              <TextField
                label="ownerExternalSubject"
                onChange={(value) => setProvisionForm((current) => ({ ...current, ownerExternalSubject: value }))}
                value={provisionForm.ownerExternalSubject}
              />
            </div>
          </ActionBlock>
        </FlowPanel>

        <FlowPanel title="Tenant administration">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Listado administrativo. Captura el primer tenant devuelto si existe."
            meta={actions.listTenants}
            onRun={() => runAction(actions.listTenants, () => ragPymesApi.accessManagement.listTenants())}
            title="List tenants"
          />
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Usa tenantId compartido para consultar detalle administrativo."
            meta={actions.getTenant}
            onRun={() => runAction(actions.getTenant, () => ragPymesApi.accessManagement.getTenant(variables.tenantId))}
            title="Get tenant"
          >
            <VariableHint label="tenantId" value={variables.tenantId} />
          </ActionBlock>
        </FlowPanel>

        <FlowPanel title="Invitations">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Roles documentados: TenantOwner, TenantAdmin, TenantMember."
            meta={actions.createTenantInvitation}
            onRun={() =>
              runAction(actions.createTenantInvitation, () =>
                ragPymesApi.accessManagement.createTenantInvitation(
                  variables.tenantId,
                  toCreateTenantInvitationRequest(invitationForm),
                ),
              )
            }
            title="Create invitation"
          >
            <div className={styles.formGrid}>
              <VariableHint label="tenantId" value={variables.tenantId} />
              <TextField
                label="email"
                onChange={(value) => setInvitationForm((current) => ({ ...current, email: value }))}
                value={invitationForm.email}
              />
              <RoleSelect
                label="role"
                onChange={(role) => setInvitationForm((current) => ({ ...current, role }))}
                value={invitationForm.role}
              />
            </div>
          </ActionBlock>

          <div className={styles.buttonRow}>
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.listTenantInvitations}
              onRun={() =>
                runAction(actions.listTenantInvitations, () =>
                  ragPymesApi.accessManagement.listTenantInvitations(variables.tenantId),
                )
              }
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.acceptTenantInvitation}
              onRun={() =>
                runAction(actions.acceptTenantInvitation, () =>
                  ragPymesApi.accessManagement.acceptTenantInvitation(variables.invitationToken),
                )
              }
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.revokeTenantInvitation}
              onRun={() =>
                runAction(actions.revokeTenantInvitation, () =>
                  ragPymesApi.accessManagement.revokeTenantInvitation(variables.tenantId, variables.invitationId),
                )
              }
            />
          </div>
        </FlowPanel>

        <FlowPanel title="Memberships">
          <div className={styles.formGrid}>
            <VariableHint label="tenantId" value={variables.tenantId} />
            <VariableHint label="membershipId" value={variables.membershipId} />
            <RoleSelect
              label="new role"
              onChange={(role) => setMembershipForm((current) => ({ ...current, role }))}
              value={membershipForm.role}
            />
          </div>
          <div className={styles.buttonRow}>
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.listTenantMemberships}
              onRun={() =>
                runAction(actions.listTenantMemberships, () =>
                  ragPymesApi.accessManagement.listTenantMemberships(variables.tenantId),
                )
              }
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.changeTenantMembershipRole}
              onRun={() =>
                runAction(actions.changeTenantMembershipRole, () =>
                  ragPymesApi.accessManagement.changeTenantMembershipRole(variables.tenantId, variables.membershipId, {
                    role: membershipForm.role,
                  }),
                )
              }
            />
            <SmallActionButton
              activeOperationId={activeOperationId}
              meta={actions.revokeTenantMembership}
              onRun={() =>
                runAction(actions.revokeTenantMembership, () =>
                  ragPymesApi.accessManagement.revokeTenantMembership(variables.tenantId, variables.membershipId),
                )
              }
            />
          </div>
        </FlowPanel>
      </div>

      <section className={styles.resultPanel} data-state={result?.state ?? 'idle'}>
        <div className={styles.resultHeader}>
          <div>
            <p className={styles.eyebrow}>Resultado</p>
            <h3>{result ? result.meta.operationId : 'Sin ejecutar'}</h3>
          </div>
          <div className={styles.resultMeta}>
            <span>{result?.meta.method ?? '-'}</span>
            <span>HTTP {result?.status ?? '-'}</span>
            <span>{result ? `${result.latencyMs} ms` : '- ms'}</span>
          </div>
        </div>

        {result ? (
          <div className={styles.endpointLine}>
            <span>{result.meta.endpoint}</span>
            <span>{result.meta.operationId}</span>
          </div>
        ) : null}

        {result?.error ? (
          <div className={styles.errorBox}>
            <strong>{result.error.name}</strong>
            <p>{result.error.message}</p>
            {result.error.detail ? <p>{result.error.detail}</p> : null}
          </div>
        ) : null}

        {result && Object.keys(result.captured).length > 0 ? (
          <div className={styles.capturedBox}>
            <strong>Variables actualizadas</strong>
            <span>{Object.entries(result.captured).map(([key, value]) => `${key}: ${value}`).join(' | ')}</span>
          </div>
        ) : null}

        <pre className={styles.payload}>
          {formatPayload(result?.error?.problem ?? result?.payload, 'Ejecuta una accion para ver payload o error.')}
        </pre>
      </section>
    </div>
  );
}

interface FlowPanelProps {
  children: ReactNode;
  title: string;
}

function FlowPanel({ children, title }: FlowPanelProps) {
  return (
    <section className={styles.flowPanel}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

interface ActionBlockProps {
  activeOperationId: string | null;
  children?: ReactNode;
  description: string;
  meta: ActionMeta;
  onRun: () => void;
  title: string;
}

function ActionBlock({ activeOperationId, children, description, meta, onRun, title }: ActionBlockProps) {
  return (
    <article className={styles.actionBlock}>
      <ActionHeader description={description} meta={meta} title={title} />
      {children}
      <button disabled={activeOperationId !== null} onClick={onRun} type="button">
        {activeOperationId === meta.operationId ? 'Ejecutando...' : `Ejecutar ${meta.operationId}`}
      </button>
    </article>
  );
}

interface SmallActionButtonProps {
  activeOperationId: string | null;
  meta: ActionMeta;
  onRun: () => void;
}

function SmallActionButton({ activeOperationId, meta, onRun }: SmallActionButtonProps) {
  return (
    <button className={styles.smallAction} disabled={activeOperationId !== null} onClick={onRun} type="button">
      <span>{meta.method}</span>
      {activeOperationId === meta.operationId ? 'Ejecutando...' : meta.operationId}
    </button>
  );
}

interface ActionHeaderProps {
  description: string;
  meta: ActionMeta;
  title: string;
}

function ActionHeader({ description, meta, title }: ActionHeaderProps) {
  return (
    <div className={styles.actionHeader}>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <dl>
        <div>
          <dt>method</dt>
          <dd>{meta.method}</dd>
        </div>
        <div>
          <dt>endpoint</dt>
          <dd>{meta.endpoint}</dd>
        </div>
        <div>
          <dt>operationId</dt>
          <dd>{meta.operationId}</dd>
        </div>
      </dl>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  onChange: (value: string) => void;
  value: string;
}

function TextField({ label, onChange, value }: TextFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

interface RoleSelectProps {
  label: string;
  onChange: (role: TenantRole) => void;
  value: TenantRole;
}

function RoleSelect({ label, onChange, value }: RoleSelectProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value as TenantRole)} value={value}>
        {tenantRoles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </label>
  );
}

interface VariableHintProps {
  label: string;
  value: string;
}

function VariableHint({ label, value }: VariableHintProps) {
  return (
    <div className={styles.variableHint}>
      <span>{label}</span>
      <strong>{value || 'Sin valor'}</strong>
    </div>
  );
}

function toRegisterTenantRequest(form: typeof initialRegisterForm): RegisterTenantRequest {
  return {
    companyName: form.companyName,
    contactEmail: optionalText(form.contactEmail),
    slug: optionalText(form.slug),
  };
}

function toProvisionTenantRequest(form: typeof initialProvisionForm): ProvisionTenantRequest {
  return {
    name: form.name,
    ownerExternalSubject: form.ownerExternalSubject,
    ownerIssuer: form.ownerIssuer,
  };
}

function toCreateTenantInvitationRequest(form: typeof initialInvitationForm): CreateTenantInvitationRequest {
  return {
    email: form.email,
    role: form.role,
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function captureSharedVariables(payload: unknown): Partial<SharedVariables> {
  const captured: Partial<SharedVariables> = {};
  const root = asRecord(payload);

  const tenant = asRecord(root?.tenant);
  const ownerMembership = asRecord(root?.ownerMembership);
  const invitation = asRecord(root?.invitation);
  const membership = asRecord(root?.membership);
  const firstTenant = firstRecord(root?.tenants);
  const firstInvitation = firstRecord(root?.invitations);
  const firstMembership = firstRecord(root?.memberships);

  assignString(captured, 'tenantId', tenant?.id ?? invitation?.tenantId ?? membership?.tenantId ?? firstTenant?.id);
  assignString(captured, 'membershipId', ownerMembership?.id ?? membership?.id ?? firstMembership?.id);
  assignString(captured, 'invitationId', invitation?.id ?? firstInvitation?.id);
  assignString(captured, 'invitationToken', root?.invitationToken);

  if (!captured.tenantId) {
    assignString(captured, 'tenantId', ownerMembership?.tenantId ?? firstInvitation?.tenantId ?? firstMembership?.tenantId);
  }

  return captured;
}

function assignString<T extends keyof SharedVariables>(
  target: Partial<SharedVariables>,
  key: T,
  value: unknown,
) {
  if (typeof value === 'string' && value.trim().length > 0) {
    target[key] = value;
  }
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function firstRecord(value: unknown) {
  return Array.isArray(value) ? asRecord(value[0]) : null;
}

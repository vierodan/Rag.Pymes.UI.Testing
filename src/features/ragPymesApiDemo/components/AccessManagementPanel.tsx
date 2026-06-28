import { useState, type ReactNode } from 'react';
import { getLastResponseStatus } from '../../../api/httpClient';
import { ragPymesApi } from '../../../api/ragPymesApi';
import type {
  CreateTenantInvitationRequest,
  ProvisionTenantRequest,
  RegisterTenantRequest,
} from '../../../api/contracts';
import type { SharedDemoVariables, UpdateSharedDemoVariables } from '../types/demoVariables';
import { normalizeApiError, type NormalizedApiError } from './apiResultUtils';
import { ApiActionButton } from './ApiActionButton';
import { EndpointStepTitle } from './EndpointStepTitle';
import { FeatureExplainerCards, type FeatureExplainerCardsProps } from './FeatureExplainerCards';
import { OperationResultCard } from './OperationResultCard';
import styles from './AccessManagementPanel.module.css';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type TenantRole = 'TenantOwner' | 'TenantAdmin' | 'TenantMember';

interface ActionMeta {
  endpoint: string;
  method: HttpMethod;
  operationId: string;
}

interface ActionResult {
  captured: Partial<SharedDemoVariables>;
  error?: NormalizedApiError;
  latencyMs: number;
  payload?: unknown;
  status: number | null;
  state: 'success' | 'error';
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

const accessSectionHelp = {
  tenantOnboarding: {
    ariaLabel: 'Como probar y que hace Tenant onboarding',
    howTo: {
      hint: 'Son dos caminos distintos: RegisterTenant es alta self-service de empresa; ProvisionTenant es alta técnica/backoffice con identidad de provisioning.',
      steps: [
        'Para RegisterTenant, usa un Bearer token de usuario: el owner se resuelve desde claims firmados del token.',
        'Rellena companyName; slug y contactEmail son opcionales en contrato, aunque la UI los deja editables.',
        'Para ProvisionTenant, usa la identidad técnica configurada en AccessManagement:Provisioner:Issuer y Subject.',
        'Ejecuta la acción y confirma que la respuesta incluye tenant y ownerMembership con rol TenantOwner.',
      ],
    },
    what: {
      description: 'Crea un tenant activo y su primera membresía owner. Es el punto de entrada para cualquier prueba posterior de invitaciones, memberships o Knowledge.',
      fields: ['RegisterTenant: companyName obligatorio, máximo 160 caracteres; slug opcional, único, en minúsculas, 3-80 caracteres, solo letras, números y guiones, sin guiones iniciales/finales ni consecutivos.', 'RegisterTenant no acepta issuer, externalSubject, actorId ni roles en el body: el actor autenticado sale exclusivamente del token.', 'ProvisionTenant: name, ownerIssuer y ownerExternalSubject obligatorios; solo puede ejecutarlo la identidad técnica configurada.', 'Ambos flujos crean el tenant en estado Active y una TenantMembership activa con rol TenantOwner.'],
      response: ['201 Created con tenant: id, name, slug, status, createdAt, suspendedAt y version.', 'ownerMembership: id, tenantId, subjectId, role, status, fechas y version.', 'Location hacia /api/v1/tenants/{tenantId}.', 'ProblemDetails con 400 por validación, 401/403 por autenticación/autorización, 409 por conflicto de slug y 429 por cuota de registro.'],
    },
  },
  tenantAdministration: {
    ariaLabel: 'Como probar y que hace Tenant administration',
    howTo: {
      hint: 'Estas acciones usan el plano administrativo de tenants; no equivalen al selector de tenants del usuario /api/v1/me/tenants.',
      steps: [
        'Usa un token con permisos de plataforma o la configuración de desarrollo que permita probar este plano.',
        'Ejecuta ListTenants para obtener tenants administrables y capturar tenantId si la respuesta trae alguno.',
        'Ejecuta GetTenant con el tenantId compartido para validar detalle administrativo.',
        'Si necesitas la lista de tenants visibles para el usuario autenticado, usa /api/v1/me/tenants desde el explorador avanzado.',
      ],
    },
    what: {
      description: 'Permite comprobar el plano administrativo de tenants: listado global y lectura de detalle por id.',
      fields: ['ListTenants ejecuta GET /api/v1/tenants y no tiene body.', 'GetTenant ejecuta GET /api/v1/tenants/{tenantId}; tenantId no puede ser Guid.Empty.', 'Estas rutas requieren permisos de plataforma según la API pública de AccessManagement.'],
      response: ['ListTenants devuelve tenants con id, name, slug, status, createdAt, suspendedAt y version.', 'GetTenant devuelve un objeto tenant con el mismo contrato.', '404 si el tenant no existe o no es accesible; 401/403 si falta autenticación o permiso de plataforma.'],
    },
  },
  invitations: {
    ariaLabel: 'Como probar y que hace Invitations',
    howTo: {
      hint: 'La creación de memberships humanas debe pasar por invitación y aceptación autenticada; el endpoint legacy de creación directa no forma parte de la API SaaS pública.',
      steps: [
        'Confirma que tenantId pertenece a un tenant activo y que el actor puede administrar invitaciones.',
        'Crea una invitación con email y role usando TenantOwner, TenantAdmin o TenantMember.',
        'Guarda el invitationToken devuelto: es sensible y se usa en POST /api/v1/invitations/{token}/accept.',
        'Lista invitaciones para auditar estado o revoca usando tenantId e invitationId.',
      ],
    },
    what: {
      description: 'Gestiona la incorporación de usuarios humanos a un tenant mediante invitaciones por email y aceptación con el usuario autenticado.',
      fields: ['Create invitation: email y role son obligatorios; role debe ser TenantOwner, TenantAdmin o TenantMember.', 'TenantOwner puede invitar cualquier rol; TenantAdmin puede invitar TenantAdmin o TenantMember, pero no TenantOwner.', 'Accept invitation usa token en ruta y no tiene body; el actor se resuelve desde su propio Bearer token.', 'Revoke invitation usa tenantId e invitationId y no elimina memberships ya activadas.'],
      response: ['201 Created con invitation en estado Pending, expiresAt, version e invitationToken.', 'Accept devuelve invitation y membership activada o creada.', 'Revoke devuelve invitation en estado revocado.', '403 si el email del actor no coincide al aceptar; 404 si el token no existe; 409 si ya fue aceptada o revocada.'],
    },
  },
  memberships: {
    ariaLabel: 'Como probar y que hace Memberships',
    howTo: {
      hint: 'El último TenantOwner activo está protegido: no puede perder el rol owner ni ser revocado si deja el tenant sin propietario.',
      steps: [
        'Lista memberships del tenant para elegir un membershipId válido.',
        'Selecciona el nuevo rol antes de ejecutar ChangeTenantMembershipRole.',
        'Ejecuta revoke solo en entornos no productivos y revisa el resultado 204 No Content.',
        'Si recibes 409, comprueba si estás intentando modificar o revocar el último TenantOwner activo.',
      ],
    },
    what: {
      description: 'Administra la relación entre un usuario humano y un tenant: listado de membresías, cambio de rol y cierre de acceso.',
      fields: ['tenantId y membershipId no pueden ser Guid.Empty.', 'role es obligatorio y acepta TenantOwner, TenantAdmin o TenantMember.', 'TenantAdmin no puede modificar owners ni asignar TenantOwner.', 'Una membership contiene subjectId, role, status, createdAt, activatedAt, suspendedAt, revokedAt y version.'],
      response: ['List memberships devuelve memberships del tenant.', 'Change role devuelve membership actualizada con version incrementada.', 'Revoke devuelve 204 No Content; si la membership ya estaba revocada, la operación es idempotente.', '403 por falta de privilegios; 409 por conflicto de estado o protección del último owner.'],
    },
  },
} satisfies Record<string, FeatureExplainerCardsProps>;

interface AccessManagementPanelProps {
  updateVariables: UpdateSharedDemoVariables;
  variables: SharedDemoVariables;
}

export function AccessManagementPanel({ updateVariables, variables }: AccessManagementPanelProps) {
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [provisionForm, setProvisionForm] = useState(initialProvisionForm);
  const [invitationForm, setInvitationForm] = useState(initialInvitationForm);
  const [membershipForm, setMembershipForm] = useState(initialMembershipForm);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});

  async function runAction(meta: ActionMeta, action: () => Promise<unknown>) {
    setActiveOperationId(meta.operationId);
    const startedAt = performance.now();

    try {
      const payload = await action();
      const latencyMs = Math.round(performance.now() - startedAt);
      const captured = captureSharedVariables(payload);
      const status = getLastResponseStatus();

      if (Object.keys(captured).length > 0) {
        updateVariables(captured);
      }

      setResults((current) => ({
        ...current,
        [meta.operationId]: {
        captured,
        latencyMs,
        payload,
        status,
        state: 'success',
        },
      }));
    } catch (error) {
      const normalizedError = normalizeApiError(
        error,
        'Comprueba la base URL, el token Bearer y los permisos del actor autenticado.',
      );

      setResults((current) => ({
        ...current,
        [meta.operationId]: {
        captured: {},
        error: normalizedError,
        latencyMs: Math.round(performance.now() - startedAt),
        payload: normalizedError.problem,
        status: normalizedError.status ?? null,
        state: 'error',
        },
      }));
    } finally {
      setActiveOperationId(null);
    }
  }

  function clearResult(operationId: string) {
    setResults((current) => {
      const { [operationId]: _removed, ...remaining } = current;
      return remaining;
    });
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
            onChange={(value) => updateVariables({ tenantId: value })}
            value={variables.tenantId}
          />
          <TextField
            label="membershipId"
            onChange={(value) => updateVariables({ membershipId: value })}
            value={variables.membershipId}
          />
          <TextField
            label="invitationId"
            onChange={(value) => updateVariables({ invitationId: value })}
            value={variables.invitationId}
          />
          <TextField
            label="invitationToken"
            onChange={(value) => updateVariables({ invitationToken: value })}
            value={variables.invitationToken}
          />
        </div>
      </section>

      <div className={styles.flowGrid}>
        <FlowPanel help={accessSectionHelp.tenantOnboarding} title="Tenant onboarding">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Self-service. El actor sale del token; no envies issuer, subject ni roles."
            meta={actions.registerTenant}
            onClearResult={clearResult}
            onRun={() =>
              runAction(actions.registerTenant, () =>
                ragPymesApi.accessManagement.registerTenant(toRegisterTenantRequest(registerForm)),
              )
            }
            title="Register tenant"
            result={results[actions.registerTenant.operationId]}
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
            onClearResult={clearResult}
            onRun={() =>
              runAction(actions.provisionTenant, () =>
                ragPymesApi.accessManagement.provisionTenant(toProvisionTenantRequest(provisionForm)),
              )
            }
            title="Provision tenant"
            result={results[actions.provisionTenant.operationId]}
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

        <FlowPanel help={accessSectionHelp.tenantAdministration} title="Tenant administration">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Listado administrativo. Captura el primer tenant devuelto si existe."
            meta={actions.listTenants}
            onClearResult={clearResult}
            onRun={() => runAction(actions.listTenants, () => ragPymesApi.accessManagement.listTenants())}
            result={results[actions.listTenants.operationId]}
            title="List tenants"
          />
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Usa tenantId compartido para consultar detalle administrativo."
            meta={actions.getTenant}
            onClearResult={clearResult}
            onRun={() => runAction(actions.getTenant, () => ragPymesApi.accessManagement.getTenant(variables.tenantId))}
            result={results[actions.getTenant.operationId]}
            title="Get tenant"
          >
            <VariableHint label="tenantId" value={variables.tenantId} />
          </ActionBlock>
        </FlowPanel>

        <FlowPanel help={accessSectionHelp.invitations} title="Invitations">
          <ActionBlock
            activeOperationId={activeOperationId}
            description="Roles documentados: TenantOwner, TenantAdmin, TenantMember."
            meta={actions.createTenantInvitation}
            onClearResult={clearResult}
            onRun={() =>
              runAction(actions.createTenantInvitation, () =>
                ragPymesApi.accessManagement.createTenantInvitation(
                  variables.tenantId,
                  toCreateTenantInvitationRequest(invitationForm),
                ),
              )
            }
            title="Create invitation"
            result={results[actions.createTenantInvitation.operationId]}
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
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Lista las invitaciones del tenant para auditar estado, expiracion, aceptacion o revocacion."
              meta={actions.listTenantInvitations}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.listTenantInvitations, () =>
                  ragPymesApi.accessManagement.listTenantInvitations(variables.tenantId),
                )
              }
              result={results[actions.listTenantInvitations.operationId]}
              title="List invitations"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Acepta una invitacion con el token capturado y el usuario autenticado actual."
              meta={actions.acceptTenantInvitation}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.acceptTenantInvitation, () =>
                  ragPymesApi.accessManagement.acceptTenantInvitation(variables.invitationToken),
                )
              }
              result={results[actions.acceptTenantInvitation.operationId]}
              title="Accept invitation"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Revoca una invitacion usando tenantId e invitationId compartidos."
              meta={actions.revokeTenantInvitation}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.revokeTenantInvitation, () =>
                  ragPymesApi.accessManagement.revokeTenantInvitation(variables.tenantId, variables.invitationId),
                )
              }
              result={results[actions.revokeTenantInvitation.operationId]}
              title="Revoke invitation"
            />
          </div>
        </FlowPanel>

        <FlowPanel help={accessSectionHelp.memberships} title="Memberships">
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
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Lista todas las memberships del tenant con subjectId, role, status y version."
              meta={actions.listTenantMemberships}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.listTenantMemberships, () =>
                  ragPymesApi.accessManagement.listTenantMemberships(variables.tenantId),
                )
              }
              result={results[actions.listTenantMemberships.operationId]}
              title="List memberships"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Cambia el rol de una membership respetando permisos y proteccion del ultimo owner."
              meta={actions.changeTenantMembershipRole}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.changeTenantMembershipRole, () =>
                  ragPymesApi.accessManagement.changeTenantMembershipRole(variables.tenantId, variables.membershipId, {
                    role: membershipForm.role,
                  }),
                )
              }
              result={results[actions.changeTenantMembershipRole.operationId]}
              title="Change membership role"
            />
            <ActionBlock
              activeOperationId={activeOperationId}
              description="Revoca la membership indicada; devuelve 204 No Content cuando se completa."
              meta={actions.revokeTenantMembership}
              onClearResult={clearResult}
              onRun={() =>
                runAction(actions.revokeTenantMembership, () =>
                  ragPymesApi.accessManagement.revokeTenantMembership(variables.tenantId, variables.membershipId),
                )
              }
              result={results[actions.revokeTenantMembership.operationId]}
              title="Revoke membership"
            />
          </div>
        </FlowPanel>
      </div>
    </div>
  );
}

interface FlowPanelProps {
  children: ReactNode;
  help: FeatureExplainerCardsProps;
  title: string;
}

function FlowPanel({ children, help, title }: FlowPanelProps) {
  return (
    <section className={styles.flowPanel}>
      <h3>{title}</h3>
      <FeatureExplainerCards {...help} />
      {children}
    </section>
  );
}

interface ActionBlockProps {
  activeOperationId: string | null;
  children?: ReactNode;
  description: string;
  meta: ActionMeta;
  onClearResult: (operationId: string) => void;
  onRun: () => void;
  result?: ActionResult;
  title: string;
}

function ActionBlock({
  activeOperationId,
  children,
  description,
  meta,
  onClearResult,
  onRun,
  result,
  title,
}: ActionBlockProps) {
  const capturedExtra =
    result && Object.keys(result.captured).length > 0 ? (
      <div className={styles.capturedBox}>
        <strong>Variables actualizadas</strong>
        <span>{Object.entries(result.captured).map(([key, value]) => `${key}: ${value}`).join(' | ')}</span>
      </div>
    ) : undefined;

  return (
    <article className={styles.actionBlock}>
      <ActionHeader description={description} meta={meta} title={title} />
      {children}
      <div className={styles.endpointStepAction}>
        <ApiActionButton
          disabled={activeOperationId !== null}
          method={meta.method}
          onClick={onRun}
          path={meta.endpoint}
        />
      </div>
      <OperationResultCard
        idleMessage={`Ejecuta ${meta.operationId} para ver el resultado de esta operacion.`}
        onClearResult={result ? () => onClearResult(meta.operationId) : undefined}
        result={result ? { ...result, extra: capturedExtra } : undefined}
      />
    </article>
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
        <EndpointStepTitle path={meta.endpoint} title={title} />
        <p>{description}</p>
      </div>
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

function captureSharedVariables(payload: unknown): Partial<SharedDemoVariables> {
  const captured: Partial<SharedDemoVariables> = {};
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

function assignString<T extends keyof SharedDemoVariables>(
  target: Partial<SharedDemoVariables>,
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

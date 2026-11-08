import React, { createContext, useCallback, useContext, useState } from 'react';
import { apiRequest, clearMemorySession, setMemorySession } from '../api/client';
import type {
  AuthProfileResponse,
  MembershipSummary,
  TenantProvisionResponse,
  TokenSessionResponse,
} from '../api/generated/schema';

interface AuthContextValue {
  user: AuthProfileResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  memberships: MembershipSummary[];
  activeTenantId: string | null;
  activeRole: string | null;
  login: (params: { email: string; password: string; tenantId?: string }) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    fullName: string;
    tenantName?: string;
    tenantSlug?: string;
    orgType?: 'school' | 'university' | 'training_provider' | 'corporate';
  }) => Promise<string | null>;
  switchTenant: (tenantId: string) => Promise<void>;
  provisionTenant: (params: {
    name: string;
    slug: string;
    institution_type: 'school' | 'university' | 'training_provider' | 'corporate';
  }) => Promise<TenantProvisionResponse>;
  createTenant: (
    name: string,
    slug: string,
    orgType: 'school' | 'university' | 'training_provider' | 'corporate',
  ) => Promise<TenantProvisionResponse>;
  acceptInvitation: (token: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeRoleCode(role?: string | null): string {
  if (!role) return 'learner';
  if (role === 'owner') return 'tenant_owner';
  if (role === 'admin') return 'tenant_admin';
  return role;
}

function normalizeSessionUser(res: TokenSessionResponse): AuthProfileResponse {
  const rawMemberships = res.memberships ?? res.user?.memberships ?? [];
  const memberships: MembershipSummary[] = rawMemberships.map((m) => {
    const rawRole = m.role ?? m.roles?.[0] ?? 'learner';
    const normRole = normalizeRoleCode(rawRole);
    const normRoles = (m.roles ?? (m.role ? [m.role] : ['learner'])).map(normalizeRoleCode);
    return {
      ...m,
      role: normRole,
      roles: normRoles,
    };
  });
  const activeTenantId =
    res.active_tenant_id ??
    res.user?.active_tenant_id ??
    memberships[0]?.tenant_id ??
    null;
  const rawActiveRole =
    res.active_role ??
    res.user?.active_role ??
    res.user?.active_roles?.[0] ??
    memberships.find((m) => m.tenant_id === activeTenantId)?.role ??
    memberships[0]?.role ??
    null;
  const activeRole = rawActiveRole ? normalizeRoleCode(rawActiveRole) : null;

  return {
    ...res.user,
    user_id: res.user?.user_id ?? res.user?.id ?? '',
    active_tenant_id: activeTenantId,
    active_role: activeRole,
    active_roles: (res.user?.active_roles ?? (activeRole ? [activeRole] : [])).map(normalizeRoleCode),
    memberships,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfileResponse | null>(null);
  const [isLoading] = useState<boolean>(false);

  const applySession = useCallback((res: TokenSessionResponse) => {
    const normalizedUser = normalizeSessionUser(res);
    setMemorySession({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      activeTenantId: normalizedUser.active_tenant_id,
    });
    setUser(normalizedUser);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await apiRequest<AuthProfileResponse>('/auth/me');
    const memberships = (profile.memberships ?? []).map((m) => {
      const normRole = normalizeRoleCode(m.role ?? m.roles?.[0] ?? 'learner');
      return {
        ...m,
        role: normRole,
        roles: (m.roles ?? (m.role ? [m.role] : ['learner'])).map(normalizeRoleCode),
      };
    });
    const rawActiveRole =
      profile.active_role ?? profile.active_roles?.[0] ?? memberships[0]?.role ?? null;
    const activeRole = rawActiveRole ? normalizeRoleCode(rawActiveRole) : null;
    setMemorySession({
      accessToken: undefined as unknown as string | null,
      activeTenantId: profile.active_tenant_id,
    });
    setUser({
      ...profile,
      active_role: activeRole,
      active_roles: (profile.active_roles ?? (activeRole ? [activeRole] : [])).map(normalizeRoleCode),
      memberships,
    });
  }, []);

  const login = useCallback(
    async (params: { email: string; password: string; tenantId?: string }) => {
      const res = await apiRequest<TokenSessionResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          tenant_id: params.tenantId || null,
        }),
      });
      applySession(res);
    },
    [applySession],
  );

  const provisionTenant = useCallback(
    async (params: {
      name: string;
      slug: string;
      institution_type: 'school' | 'university' | 'training_provider' | 'corporate';
    }) => {
      const res = await apiRequest<TenantProvisionResponse>('/tenants', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      setMemorySession({
        accessToken: res.access_token,
        activeTenantId: res.tenant.id,
      });
      try {
        const profile = await apiRequest<AuthProfileResponse>('/auth/me');
        const memberships = (profile.memberships ?? []).map((m) => ({
          ...m,
          role: m.role ?? m.roles?.[0] ?? 'tenant_owner',
          roles: m.roles ?? ['tenant_owner'],
        }));
        setUser({
          ...profile,
          active_tenant_id: res.tenant.id,
          active_role: profile.active_roles?.[0] ?? 'tenant_owner',
          memberships,
        });
      } catch {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                active_tenant_id: res.tenant.id,
                active_role: res.assigned_roles?.[0] ?? 'tenant_owner',
                memberships: [
                  ...(prev.memberships ?? []),
                  {
                    membership_id: res.membership_id,
                    tenant_id: res.tenant.id,
                    tenant_name: res.tenant.name,
                    tenant_slug: res.tenant.slug,
                    role: res.assigned_roles?.[0] ?? 'tenant_owner',
                    roles: res.assigned_roles ?? ['tenant_owner'],
                    status: 'active',
                  },
                ],
              }
            : prev,
        );
      }
      return res;
    },
    [],
  );

  const createTenant = useCallback(
    async (
      name: string,
      slug: string,
      orgType: 'school' | 'university' | 'training_provider' | 'corporate',
    ) => {
      return provisionTenant({ name, slug, institution_type: orgType });
    },
    [provisionTenant],
  );

  const register = useCallback(
    async (params: {
      email: string;
      password: string;
      fullName: string;
      tenantName?: string;
      tenantSlug?: string;
      orgType?: 'school' | 'university' | 'training_provider' | 'corporate';
    }) => {
      const res = await apiRequest<TokenSessionResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          full_name: params.fullName,
        }),
      });
      applySession(res);
      if (params.tenantName && params.tenantSlug) {
        await provisionTenant({
          name: params.tenantName,
          slug: params.tenantSlug,
          institution_type: params.orgType ?? 'university',
        });
      }
      return res.verification_token_dev_hint || null;
    },
    [applySession, provisionTenant],
  );

  const switchTenant = useCallback(
    async (tenantId: string) => {
      const res = await apiRequest<TokenSessionResponse>('/auth/switch-tenant', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      applySession(res);
    },
    [applySession],
  );

  const acceptInvitation = useCallback(
    async (token: string) => {
      const member = await apiRequest<{ tenant_id: string }>('/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      const switched = await apiRequest<TokenSessionResponse>('/auth/switch-tenant', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: member.tenant_id }),
      });
      applySession(switched);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', skipAuthRefresh: true });
    } finally {
      clearMemorySession();
      setUser(null);
    }
  }, []);

  const memberships = user?.memberships ?? [];
  const activeTenantId = user?.active_tenant_id ?? null;
  const activeRole =
    user?.active_role ??
    user?.active_roles?.[0] ??
    memberships.find((m) => m.tenant_id === activeTenantId)?.role ??
    null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        memberships,
        activeTenantId,
        activeRole,
        login,
        register,
        switchTenant,
        provisionTenant,
        createTenant,
        acceptInvitation,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const AuthSessionProvider = AuthProvider;

export function useAuthSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within an AuthProvider');
  }
  return ctx;
}

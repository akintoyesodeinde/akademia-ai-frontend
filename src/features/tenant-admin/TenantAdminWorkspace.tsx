import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { AlertBanner, Badge, Button, Card, Input, Select } from "../../components/ui/Primitives";
import type { AuditEventResponse, InvitationCreateResponse, MemberResponse } from "../../api/generated/schema";

export const TenantAdminWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSubtab, setActiveSubtab] = useState<
    "overview" | "members" | "cohorts" | "subscription" | "audit"
  >("overview");
  const [banner, setBanner] = useState<{
    variant: "info" | "success" | "warning" | "error";
    text: string;
  } | null>(null);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState("instructor2@institution.edu");
  const [inviteRole, setInviteRole] = useState<"tenant_admin" | "instructor" | "learner">("instructor");
  const [lastInvitation, setLastInvitation] = useState<InvitationCreateResponse | null>(null);

  // Cohort State
  const [cohortName, setCohortName] = useState("Fall 2026 Engineering Cohort");
  const [cohortDescription, setCohortDescription] = useState("Undergraduate Computer Science Track");

  // Queries
  const tenantQuery = useQuery({
    queryKey: ["current-tenant"],
    queryFn: () => apiClient.getCurrentTenant(),
  });

  const membersQuery = useQuery({
    queryKey: ["tenant-members"],
    queryFn: () => apiClient.listMembers(),
  });

  const cohortsQuery = useQuery({
    queryKey: ["tenant-cohorts"],
    queryFn: () => apiClient.listCohorts(),
  });

  const subscriptionQuery = useQuery({
    queryKey: ["tenant-subscription"],
    queryFn: () => apiClient.getSubscriptionSummary(),
  });

  const auditEventsQuery = useQuery({
    queryKey: ["tenant-audit-events"],
    queryFn: () => apiClient.listAuditEvents(1, 30),
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: () => apiClient.createInvitation({ email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: (created) => {
      setLastInvitation(created);
      setBanner({
        variant: "success",
        text: `Created invitation for ${created.email} (${created.role}). Share the one-time token below.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["tenant-audit-events"] });
    },
    onError: (err: Error) => setBanner({ variant: "error", text: err.message }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: string }) =>
      apiClient.updateMemberRole(membershipId, role),
    onSuccess: (updated) => {
      setBanner({
        variant: "success",
        text: `Updated role for ${updated.full_name} (${updated.email}) to ${updated.role}.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-audit-events"] });
    },
    onError: (err: Error) => setBanner({ variant: "error", text: err.message }),
  });

  const createCohortMutation = useMutation({
    mutationFn: () => apiClient.createCohort({ name: cohortName.trim(), description: cohortDescription.trim() }),
    onSuccess: (cohort) => {
      setBanner({ variant: "success", text: `Created cohort "${cohort.name}".` });
      void queryClient.invalidateQueries({ queryKey: ["tenant-cohorts"] });
    },
    onError: (err: Error) => setBanner({ variant: "error", text: err.message }),
  });

  const changePlanMutation = useMutation({
    mutationFn: (planCode: "starter" | "professional" | "enterprise") => apiClient.changePlan(planCode),
    onSuccess: (summary) => {
      setBanner({
        variant: "success",
        text: `Upgraded institutional subscription to ${summary.plan_name} (${summary.monthly_ai_token_quota.toLocaleString()} monthly AI tokens).`,
      });
      void queryClient.invalidateQueries({ queryKey: ["tenant-subscription"] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-audit-events"] });
    },
    onError: (err: Error) => setBanner({ variant: "error", text: err.message }),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {banner && (
        <AlertBanner variant={banner.variant} title="Tenant Administration">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{banner.text}</span>
            <Button size="sm" variant="ghost" onClick={() => setBanner(null)}>
              Dismiss
            </Button>
          </div>
        </AlertBanner>
      )}

      <div
        role="tablist"
        aria-label="Tenant Administration Sections"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { id: "overview", label: "Institution Profile & Settings" },
            { id: "members", label: `Members & Invitations (${membersQuery.data?.length ?? 0})` },
            { id: "cohorts", label: `Cohorts & Groups (${cohortsQuery.data?.length ?? 0})` },
            { id: "subscription", label: "Subscription Plan & AI Quotas" },
            { id: "audit", label: "Security Audit Trail" },
          ] as const
        ).map((tab) => (
          <Button
            key={tab.id}
            role="tab"
            aria-selected={activeSubtab === tab.id}
            variant={activeSubtab === tab.id ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveSubtab(tab.id)}
            data-testid={`tenant-admin-tab-${tab.id}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSubtab === "overview" && tenantQuery.data && (
        <Card
          title={`Institution: ${tenantQuery.data.name}`}
          subtitle="Verified multi-tenant boundary isolated by PostgreSQL Row-Level Security (RLS)"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tenant ID (UUID)</div>
              <code style={{ fontSize: "0.85rem", fontWeight: 600 }}>{tenantQuery.data.id}</code>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tenant Slug</div>
              <div style={{ fontSize: "1rem", fontWeight: 700 }}>{tenantQuery.data.slug}</div>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Institution Type & Status</div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <Badge variant="info">{tenantQuery.data.organization_type}</Badge>
                <Badge variant={tenantQuery.data.status === "active" ? "success" : "danger"}>
                  {tenantQuery.data.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* MEMBERS & INVITATIONS */}
      {activeSubtab === "members" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "1.25rem" }}>
          <Card title="Invite Institutional Member" subtitle="Issue a cryptographic invitation token scoped to this tenant">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                inviteMutation.mutate();
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <Input
                label="Invitee Email Address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                data-testid="invite-email-input"
              />
              <Select
                label="Assigned Tenant Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "tenant_admin" | "instructor" | "learner")}
                options={[
                  { value: "instructor", label: "Instructor (Author Courses, Review Analytics)" },
                  { value: "learner", label: "Learner (Enroll, Study, AI Tutor, Assessments)" },
                  { value: "tenant_admin", label: "Tenant Admin (Manage Members, Billing & Audit)" },
                ]}
              />
              <Button type="submit" isLoading={inviteMutation.isPending} data-testid="send-invite-btn">
                Create Tenant Invitation
              </Button>
            </form>

            {lastInvitation && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.875rem",
                  backgroundColor: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.8125rem",
                }}
              >
                <div>
                  <strong>Invitation Created for {lastInvitation.email}</strong> ({lastInvitation.role})
                </div>
                <div style={{ marginTop: "0.35rem" }}>
                  One-time Token:{" "}
                  <code data-testid="generated-invite-token" style={{ userSelect: "all", fontWeight: 700 }}>
                    {lastInvitation.invitation_token}
                  </code>
                </div>
              </div>
            )}
          </Card>

          <Card title="Active Tenant Memberships" subtitle="Manage RBAC roles within this tenant">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem" }}>Name & Email</th>
                  <th style={{ padding: "0.5rem" }}>Current Role</th>
                  <th style={{ padding: "0.5rem" }}>Status</th>
                  <th style={{ padding: "0.5rem" }}>Update Role</th>
                </tr>
              </thead>
              <tbody>
                {(membersQuery.data ?? []).map((m: MemberResponse) => (
                  <tr key={m.membership_id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.5rem" }}>
                      <strong>{m.full_name}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.email}</div>
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <Badge variant="info">{m.role}</Badge>
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <Badge variant={m.status === "active" ? "success" : "warning"}>{m.status}</Badge>
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <select
                        aria-label={`Change role for ${m.email}`}
                        value={m.role}
                        onChange={(e) =>
                          changeRoleMutation.mutate({ membershipId: m.membership_id, role: e.target.value })
                        }
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <option value="tenant_owner">tenant_owner</option>
                        <option value="tenant_admin">tenant_admin</option>
                        <option value="instructor">instructor</option>
                        <option value="learner">learner</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* COHORTS */}
      {activeSubtab === "cohorts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <Card title="Create Learner Cohort" subtitle="Organize learners into academic terms, classes, or corporate departments">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCohortMutation.mutate();
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <Input
                label="Cohort Name"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                required
              />
              <Input
                label="Cohort Description"
                value={cohortDescription}
                onChange={(e) => setCohortDescription(e.target.value)}
              />
              <Button type="submit" isLoading={createCohortMutation.isPending}>
                + Create Cohort
              </Button>
            </form>
          </Card>

          <Card title="Institutional Cohorts" subtitle="Persisted cohorts in this tenant">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(cohortsQuery.data ?? []).map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <strong>{c.name}</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {c.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* SUBSCRIPTION & QUOTAS */}
      {activeSubtab === "subscription" && subscriptionQuery.data && (
        <Card
          title="Institutional Subscription & AI Entitlements"
          subtitle="Real-time token metering and seat quota enforcement"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Current Plan</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{subscriptionQuery.data.plan_name}</div>
              <Badge variant="success">{subscriptionQuery.data.status.toUpperCase()}</Badge>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>AI Token Usage</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {subscriptionQuery.data.used_ai_tokens.toLocaleString()} /{" "}
                {subscriptionQuery.data.monthly_ai_token_quota.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {subscriptionQuery.data.remaining_ai_tokens.toLocaleString()} remaining
              </div>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Seat Limit</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {subscriptionQuery.data.seat_limit} seats
              </div>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Document Storage Limit</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {subscriptionQuery.data.storage_limit_mb} MB
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <strong>Change Institutional Subscription Tier:</strong>
            {(["starter", "professional", "enterprise"] as const).map((tier) => (
              <Button
                key={tier}
                size="sm"
                variant={subscriptionQuery.data?.plan_code === tier ? "primary" : "secondary"}
                isLoading={changePlanMutation.isPending}
                onClick={() => changePlanMutation.mutate(tier)}
                data-testid={`plan-btn-${tier}`}
              >
                {tier.toUpperCase()}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* SECURITY AUDIT TRAIL */}
      {activeSubtab === "audit" && (
        <Card
          title="Immutable Tenant Security & Governance Audit Log"
          subtitle="Every sensitive state change (role updates, course publishing, plan modifications, AI evaluations) is recorded."
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Timestamp</th>
                <th style={{ padding: "0.5rem" }}>Action</th>
                <th style={{ padding: "0.5rem" }}>Resource Type</th>
                <th style={{ padding: "0.5rem" }}>Resource ID</th>
                <th style={{ padding: "0.5rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {(auditEventsQuery.data?.items ?? []).map((ev: AuditEventResponse) => (
                <tr key={ev.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
                    {new Date(ev.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <Badge variant="info">{ev.action}</Badge>
                  </td>
                  <td style={{ padding: "0.5rem" }}>{ev.resource_type}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <code>{ev.resource_id ?? "—"}</code>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <code>{JSON.stringify(ev.metadata)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

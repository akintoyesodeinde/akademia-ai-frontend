import React, { useState } from "react";
import { useAuthSession } from "../hooks/useAuthSession";
import { LearnerWorkspace } from "../features/courses/LearnerWorkspace";
import { InstructorWorkspace } from "../features/courses/InstructorWorkspace";
import { TenantAdminWorkspace } from "../features/tenant-admin/TenantAdminWorkspace";
import { PlatformOperationsWorkspace } from "../features/billing/PlatformOperationsWorkspace";
import { AlertBanner, Badge, Button, Card, Input, Select } from "../components/ui/Primitives";

export type ActivePersonaView = "learner" | "instructor" | "tenant_admin" | "platform_ops" | "onboarding";

export const WorkspaceShell: React.FC = () => {
  const {
    user,
    memberships,
    activeTenantId,
    activeRole,
    switchTenant,
    createTenant,
    acceptInvitation,
    logout,
  } = useAuthSession();

  const defaultTab: ActivePersonaView =
    memberships.length === 0
      ? "onboarding"
      : activeRole === "tenant_owner" || activeRole === "tenant_admin"
      ? "instructor"
      : activeRole === "instructor"
      ? "instructor"
      : "learner";

  const [activeView, setActiveView] = useState<ActivePersonaView>(defaultTab);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Create Tenant State
  const [newTenantName, setNewTenantName] = useState("Apex Polytechnic Institute");
  const [newTenantSlug, setNewTenantSlug] = useState("apex-polytechnic");
  const [newOrgType, setNewOrgType] = useState<"university" | "school" | "training_provider" | "corporate">(
    "university"
  );

  // Accept Invitation State
  const [invitationToken, setInvitationToken] = useState("");

  const canAccessInstructor =
    activeRole === "tenant_owner" || activeRole === "tenant_admin" || activeRole === "instructor";
  const canAccessTenantAdmin = activeRole === "tenant_owner" || activeRole === "tenant_admin";
  const canAccessPlatformOps = Boolean(user?.is_platform_admin);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);
    setStatusSuccess(null);
    try {
      await createTenant(newTenantName.trim(), newTenantSlug.trim(), newOrgType);
      setStatusSuccess(`Created and switched to tenant "${newTenantName}".`);
      setActiveView("instructor");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to create tenant");
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);
    setStatusSuccess(null);
    try {
      await acceptInvitation(invitationToken.trim());
      setInvitationToken("");
      setStatusSuccess("Invitation accepted! Switched to the invited institutional tenant.");
      setActiveView("learner");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Global Top Navigation Header */}
      <header
        style={{
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1e293b",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.5rem",
                backgroundColor: "#3b82f6",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              A
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.1 }}>Akademia AI</div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                Multi-Tenant Learning & Intelligence Platform
              </div>
            </div>
          </div>

          {memberships.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem" }}>
              <label htmlFor="tenant-switcher" style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                Tenant:
              </label>
              <select
                id="tenant-switcher"
                data-testid="tenant-switcher-select"
                value={activeTenantId ?? ""}
                onChange={(e) => {
                  void switchTenant(e.target.value);
                }}
                style={{
                  backgroundColor: "#1e293b",
                  color: "#f8fafc",
                  border: "1px solid #334155",
                  borderRadius: "0.375rem",
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.8125rem",
                }}
              >
                {memberships.map((m) => (
                  <option key={m.tenant_id} value={m.tenant_id}>
                    {m.tenant_name} ({m.role})
                  </option>
                ))}
              </select>
              {activeRole && <Badge variant="info">{activeRole}</Badge>}
            </div>
          )}
        </div>

        {/* Role-aware Workspace Navigation */}
        <nav aria-label="Primary Workspace Mode" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {activeTenantId && (
            <Button
              size="sm"
              variant={activeView === "learner" ? "primary" : "secondary"}
              onClick={() => setActiveView("learner")}
              data-testid="nav-learner-workspace"
            >
              Learner Hub
            </Button>
          )}
          {activeTenantId && canAccessInstructor && (
            <Button
              size="sm"
              variant={activeView === "instructor" ? "primary" : "secondary"}
              onClick={() => setActiveView("instructor")}
              data-testid="nav-instructor-workspace"
            >
              Instructor Studio
            </Button>
          )}
          {activeTenantId && canAccessTenantAdmin && (
            <Button
              size="sm"
              variant={activeView === "tenant_admin" ? "primary" : "secondary"}
              onClick={() => setActiveView("tenant_admin")}
              data-testid="nav-tenant-admin-workspace"
            >
              Tenant Admin
            </Button>
          )}
          {canAccessPlatformOps && (
            <Button
              size="sm"
              variant={activeView === "platform_ops" ? "primary" : "secondary"}
              onClick={() => setActiveView("platform_ops")}
              data-testid="nav-platform-ops-workspace"
            >
              Platform Ops
            </Button>
          )}
          <Button
            size="sm"
            variant={activeView === "onboarding" ? "primary" : "secondary"}
            onClick={() => setActiveView("onboarding")}
            data-testid="nav-onboarding-workspace"
          >
            + Tenant / Invite
          </Button>
        </nav>

        {/* User Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ textAlign: "right", fontSize: "0.75rem" }}>
            <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
            <div style={{ color: "#94a3b8" }}>{user?.email}</div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              void logout();
            }}
            data-testid="logout-btn"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: "1360px", width: "100%", margin: "0 auto", padding: "1.5rem" }}>
        {statusError && (
          <div style={{ marginBottom: "1rem" }}>
            <AlertBanner variant="error" title="Operation Failed">
              {statusError}
            </AlertBanner>
          </div>
        )}
        {statusSuccess && (
          <div style={{ marginBottom: "1rem" }}>
            <AlertBanner variant="success" title="Success">
              {statusSuccess}
            </AlertBanner>
          </div>
        )}

        {activeView === "onboarding" || !activeTenantId ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <Card
              title="Provision New Institutional Tenant"
              subtitle="Create an isolated school, university, or corporate tenant with dedicated RLS policies and default Starter subscription."
            >
              <form onSubmit={handleCreateTenant} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <Input
                  label="Institution Name"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  required
                  data-testid="onboard-tenant-name"
                />
                <Input
                  label="Tenant URL Slug"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  required
                  data-testid="onboard-tenant-slug"
                />
                <Select
                  label="Organization Type"
                  value={newOrgType}
                  onChange={(e) =>
                    setNewOrgType(
                      e.target.value as "university" | "school" | "training_provider" | "corporate"
                    )
                  }
                  options={[
                    { value: "university", label: "University / Higher Education" },
                    { value: "school", label: "K-12 / Secondary School" },
                    { value: "training_provider", label: "Professional Training Provider" },
                    { value: "corporate", label: "Corporate L&D Department" },
                  ]}
                />
                <Button type="submit" data-testid="onboard-create-tenant-btn">
                  Create Institutional Tenant
                </Button>
              </form>
            </Card>

            <Card
              title="Join Existing Tenant via Invitation Token"
              subtitle="Paste a one-time invitation token issued by a Tenant Owner or Administrator."
            >
              <form onSubmit={handleAcceptInvite} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <Input
                  label="Cryptographic Invitation Token"
                  placeholder="Paste invitation token here..."
                  value={invitationToken}
                  onChange={(e) => setInvitationToken(e.target.value)}
                  required
                  data-testid="accept-invite-token-input"
                />
                <Button type="submit" variant="secondary" data-testid="accept-invite-submit-btn">
                  Accept Invitation & Switch Tenant
                </Button>
              </form>
            </Card>
          </div>
        ) : activeView === "learner" ? (
          <LearnerWorkspace />
        ) : activeView === "instructor" ? (
          <InstructorWorkspace />
        ) : activeView === "tenant_admin" ? (
          <TenantAdminWorkspace />
        ) : activeView === "platform_ops" ? (
          <PlatformOperationsWorkspace />
        ) : null}
      </main>
    </div>
  );
};

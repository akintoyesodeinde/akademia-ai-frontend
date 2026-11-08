import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { AlertBanner, Badge, Button, Card, Input } from "../../components/ui/Primitives";
import type { AIEvaluationRunResponse, PlatformTenantSummary } from "../../api/generated/schema";

export const PlatformOperationsWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const [suiteName, setSuiteName] = useState("ci-rag-safety-and-citation-benchmark-v1");
  const [evalResult, setEvalResult] = useState<AIEvaluationRunResponse | null>(null);
  const [statusReason, setStatusReason] = useState("Routine platform compliance review");

  const platformTenantsQuery = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: () => apiClient.listPlatformTenants(),
  });

  const runEvalMutation = useMutation({
    mutationFn: () => apiClient.runAIEvaluationSuite(suiteName.trim()),
    onSuccess: (res) => {
      setEvalResult(res);
    },
  });

  const updateTenantStatusMutation = useMutation({
    mutationFn: ({ tenantId, status }: { tenantId: string; status: "active" | "suspended" }) =>
      apiClient.updatePlatformTenantStatus(tenantId, status, statusReason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AlertBanner variant="info" title="Platform Operator Control Plane">
        You are authenticated with explicit <code>is_platform_admin</code> privileges. All cross-tenant actions require
        justification and are logged in the platform audit trail.
      </AlertBanner>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
        <Card
          title="Multi-Tenant SaaS Directory & Lifecycle Controls"
          subtitle="Inspect institutional tenants and enforce suspension or reactivation policies"
        >
          <div style={{ marginBottom: "0.75rem" }}>
            <Input
              label="Mandatory Audit Reason for Status Changes"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Tenant</th>
                <th style={{ padding: "0.5rem" }}>Type</th>
                <th style={{ padding: "0.5rem" }}>Status</th>
                <th style={{ padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(platformTenantsQuery.data ?? []).map((t: PlatformTenantSummary) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.5rem" }}>
                    <strong>{t.name}</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.slug}</div>
                  </td>
                  <td style={{ padding: "0.5rem" }}>{t.organization_type}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <Badge variant={t.status === "active" ? "success" : "danger"}>
                      {t.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {t.status === "active" ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => updateTenantStatusMutation.mutate({ tenantId: t.id, status: "suspended" })}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateTenantStatusMutation.mutate({ tenantId: t.id, status: "active" })}
                      >
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card
          title="AI Quality Gate & RAG Evaluation Harness"
          subtitle="Execute automated benchmark suites verifying Recall@5, Citation Authorization, Groundedness, and Zero Cross-Tenant Leakage"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runEvalMutation.mutate();
            }}
            style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1rem" }}
          >
            <div style={{ flex: 1 }}>
              <Input
                label="Evaluation Benchmark Suite Name"
                value={suiteName}
                onChange={(e) => setSuiteName(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              isLoading={runEvalMutation.isPending}
              data-testid="run-ai-eval-btn"
            >
              Run Benchmark
            </Button>
          </form>

          {evalResult && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--bg-muted)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.85rem",
              }}
              data-testid="ai-eval-results"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Suite: {evalResult.suite_name}</strong>
                <Badge variant={evalResult.passed_quality_gate ? "success" : "danger"}>
                  {evalResult.passed_quality_gate ? "QUALITY GATE PASSED" : "QUALITY GATE FAILED"}
                </Badge>
              </div>
              <div>Retrieval Recall@5: <strong>{(evalResult.retrieval_recall_at_5 * 100).toFixed(1)}%</strong></div>
              <div>Citation Authorization Rate: <strong>{(evalResult.citation_authorization_rate * 100).toFixed(1)}%</strong></div>
              <div>Groundedness Rate: <strong>{(evalResult.groundedness_rate * 100).toFixed(1)}%</strong></div>
              <div>Answer Relevance Score: <strong>{(evalResult.answer_relevance_score * 100).toFixed(1)}%</strong></div>
              <div>Unauthorized Cross-Tenant Leaks: <strong>{evalResult.unauthorized_leak_count}</strong></div>
              <div>Structured Schema Validity: <strong>{(evalResult.structured_output_validity_rate * 100).toFixed(1)}%</strong></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

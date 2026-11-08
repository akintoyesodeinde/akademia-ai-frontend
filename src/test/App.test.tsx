import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "../app/App";

describe("Akademia AI Frontend Application", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the authentication screen with accessible sign-in and institutional onboarding controls", async () => {
    render(<App />);

    expect(await screen.findByText(/Sign in or onboard your institution/i)).toBeInTheDocument();
    expect(screen.getByTestId("tab-login")).toBeInTheDocument();
    expect(screen.getByTestId("tab-register")).toBeInTheDocument();
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
  });

  it("switches to the registration form and validates institutional tenant fields", async () => {
    render(<App />);

    const registerTab = await screen.findByTestId("tab-register");
    fireEvent.click(registerTab);

    expect(screen.getByTestId("register-fullname-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-tenant-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-tenant-slug-input")).toBeInTheDocument();
  });

  it("authenticates a user with tenant context and renders the multi-tenant WorkspaceShell", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/api/v1/auth/login")) {
        return new Response(
          JSON.stringify({
            access_token: "test-jwt-token",
            refresh_token: "test-refresh-token",
            token_type: "bearer",
            expires_in: 1800,
            user: {
              id: "11111111-1111-1111-1111-111111111111",
              email: "owner@nordic-uni.edu",
              full_name: "Dr. Astrid Lindqvist",
              is_platform_admin: false,
            },
            memberships: [
              {
                membership_id: "22222222-2222-2222-2222-222222222222",
                tenant_id: "33333333-3333-3333-3333-333333333333",
                tenant_name: "Nordic Engineering University",
                tenant_slug: "nordic-uni",
                role: "tenant_owner",
                status: "active",
              },
            ],
            active_tenant_id: "33333333-3333-3333-3333-333333333333",
            active_role: "tenant_owner",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.endsWith("/api/v1/courses")) {
        return new Response(
          JSON.stringify([
            {
              id: "44444444-4444-4444-4444-444444444444",
              tenant_id: "33333333-3333-3333-3333-333333333333",
              code: "CS-301",
              title: "Distributed Systems & Consensus",
              description: "Rigorous consensus and fault tolerance course",
              status: "published",
              current_version_number: 1,
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    render(<App />);

    const submitBtn = await screen.findByTestId("auth-submit-button");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("tenant-switcher-select")).toBeInTheDocument();
    });

    expect(screen.getByText("Dr. Astrid Lindqvist")).toBeInTheDocument();
    expect(screen.getByTestId("nav-instructor-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("nav-learner-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("nav-tenant-admin-workspace")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});

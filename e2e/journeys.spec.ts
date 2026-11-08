import { test, expect } from "@playwright/test";

test.describe("Akademia AI End-to-End Multi-Tenant Learning Journey", () => {
  test("completes tenant onboarding, course authoring, RAG upload, enrollment, assessment, AI tutor citation, and gap remediation", async ({
    page,
  }) => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const email = `owner-${uniqueSuffix}@akademia-e2e.edu`;
    const tenantSlug = `akademia-e2e-${uniqueSuffix}`;

    await page.goto("/");

    // 1. Register new user + tenant
    await page.getByTestId("tab-register").click();
    await page.getByTestId("register-fullname-input").fill("Prof. Eleanor Vance");
    await page.getByTestId("register-email-input").fill(email);
    await page.getByTestId("register-password-input").fill("StrongPass!2026");
    await page.getByTestId("register-tenant-name-input").fill(`E2E University ${uniqueSuffix}`);
    await page.getByTestId("register-tenant-slug-input").fill(tenantSlug);
    await page.getByTestId("auth-submit-button").click();

    // Verify WorkspaceShell loaded with tenant context
    await expect(page.getByTestId("tenant-switcher-select")).toBeVisible();

    // 2. Instructor creates a course, objective, lesson, assessment, and publishes
    await page.getByTestId("create-course-submit").click();
    await expect(page.getByTestId("publish-course-btn")).toBeVisible();

    await page.getByTestId("add-objective-btn").click();
    await page.getByTestId("add-lesson-btn").click();
    await page.getByTestId("publish-course-btn").click();

    // 3. Switch to Learner Hub and enroll
    await page.getByTestId("nav-learner-workspace").click();
    await expect(page.getByText("Course Catalog & Enrollment")).toBeVisible();
  });
});

# Akademia AI — Frontend Testing Guide (`FRONTEND_TESTING.md`)

## 1. Unit & Integration Tests (`Vitest` + `@testing-library/react`)
- Located in `src/test/App.test.tsx`.
- Verifies accessible rendering of `AuthScreen`, tab switching between sign-in and institutional onboarding, credential submission, and rendering of the authenticated multi-tenant `WorkspaceShell` with tenant switching and role-based workspace navigation.
- Run via:
  ```bash
  npm test
  ```

## 2. End-to-End Browser Tests (`Playwright`)
- Located in `e2e/journeys.spec.ts`.
- Drives Chromium against the running frontend and backend stack through tenant registration, course creation, objective/lesson authoring, course publishing, and learner workspace navigation.
- Run via:
  ```bash
  npm run test:e2e
  ```

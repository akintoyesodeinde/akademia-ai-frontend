# Akademia AI — Frontend Architecture (`FRONTEND_ARCHITECTURE.md`)

## 1. Standalone Single-Page Application

`akademia-ai-frontend` is an independent React 18 + TypeScript 5.6 + Vite 6 repository that communicates exclusively with `akademia-ai-backend` over `/api/v1` REST contracts.

### Core Stack
- **React 18 & TypeScript (Strict Mode)**: Zero implicit `any`, strict null checks, and OpenAPI-synchronized contract interfaces (`src/api/generated/schema.ts`).
- **TanStack Query v5 (`@tanstack/react-query`)**: Server-state caching, optimistic invalidation, and automatic refetching on tenant switch.
- **React Hook Form + Zod**: Deterministic client-side schema validation before API submission.
- **Accessible Design System (`src/components/ui/Primitives.tsx`, `src/styles/global.css`)**: Semantic landmarks, ARIA tablists, live alert banners, and keyboard-accessible controls.

---

## 2. Directory Structure

```text
akademia-ai-frontend/
├── e2e/                        # Playwright E2E multi-tenant journey tests
├── scripts/
│   └── sync-openapi-types.mjs  # Verifies synchronization with backend openapi.json
├── src/
│   ├── api/
│   │   ├── generated/schema.ts # OpenAPI 3.1 TypeScript contract definitions
│   │   ├── client.ts           # In-memory JWT/refresh session client & domain methods
│   │   └── errors.ts           # Standard ErrorEnvelope parser
│   ├── app/
│   │   └── App.tsx             # QueryClientProvider, AuthSessionProvider, & AppGate
│   ├── components/ui/
│   │   └── Primitives.tsx      # Badge, AlertBanner, ErrorAlert, Button, Card, Input, Select, Textarea
│   ├── features/
│   │   ├── authentication/     # AuthScreen (Sign In, Register + Tenant Onboarding, Recovery)
│   │   ├── courses/            # LearnerWorkspace & InstructorWorkspace
│   │   ├── tenant-admin/       # TenantAdminWorkspace
│   │   └── billing/            # PlatformOperationsWorkspace
│   ├── hooks/
│   │   └── useAuthSession.tsx  # Multi-tenant session context & tenant switching
│   ├── layouts/
│   │   └── WorkspaceShell.tsx  # Role-aware workspace navigation & tenant switcher
│   └── test/                   # Vitest + Testing Library unit/integration suite
```

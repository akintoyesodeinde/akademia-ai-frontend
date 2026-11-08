# Akademia AI — Frontend (`akademia-ai-frontend`)

Production-grade React + TypeScript + Vite single-page application for the **Akademia AI Multi-Tenant SaaS Learning Management & Intelligence Platform**.

## Architecture & Key Capabilities

- **Standalone Repository**: Independently versioned, tested, and deployable frontend communicating with `akademia-ai-backend` over `/api/v1` REST contracts.
- **OpenAPI Contract Synchronization**: TypeScript types in `src/api/generated/schema.ts` are synchronized directly from the backend OpenAPI 3.1 specification via `npm run generate:api`.
- **Multi-Tenant Session & Explicit Tenant Switching**:
  - Never trusts unverified client-side tenant IDs; switches active tenant context via `POST /api/v1/auth/switch-tenant` to obtain a cryptographically signed JWT scoped to the verified tenant membership.
- **Complete Role-Based Workspaces**:
  1. **Learner Hub (`src/features/courses/LearnerWorkspace.tsx`)**:
     - Course catalog & one-click enrollment
     - Structured lesson reader with completion tracking
     - Timed/versioned assessment attempts with deterministic grading breakdown
     - Course-grounded AI Tutor with verifiable source chunk citations and academic-integrity awareness
     - Learning Intelligence Mastery Dashboard showing objective scores, confidence, knowledge gaps, recommendations, remediation plans, and follow-up `prior_score` vs. `score_delta` comparison
  2. **Instructor Studio (`src/features/courses/InstructorWorkspace.tsx`)**:
     - Draft course authoring & immutable version publishing
     - Learning objective taxonomy & lesson-to-objective mapping
     - Approved RAG document upload (`.txt`, `.md`, `.pdf`, `.docx`) & vector re-indexing
     - Objective-aligned assessment authoring & publishing
     - AI Practice Question Generator with instructor approval/rejection workflow
     - Cohort Mastery & Evidence Analytics
  3. **Tenant Administration (`src/features/tenant-admin/TenantAdminWorkspace.tsx`)**:
     - Institution profile & RLS tenant metadata
     - Member RBAC role management & cryptographic invitation token issuance
     - Learner cohort creation
     - SaaS subscription tier upgrades (`starter`, `professional`, `enterprise`) & real-time AI token quota metering
     - Immutable security audit trail viewer
  4. **Platform Operations (`src/features/billing/PlatformOperationsWorkspace.tsx`)**:
     - Cross-tenant lifecycle administration (suspend/activate with mandatory audit reason)
     - On-demand AI RAG Quality Gate & Evaluation Suite runner

## Commands

```bash
# Install dependencies
npm install

# Synchronize TypeScript contracts from backend OpenAPI schema
npm run generate:api

# Run strict TypeScript typechecking
npm run typecheck

# Run Vitest unit & integration tests
npm test

# Build production bundle
npm run build

# Run Playwright E2E suite
npm run test:e2e
```

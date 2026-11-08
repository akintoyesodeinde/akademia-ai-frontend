# Akademia AI — API Integration & Session Security (`API_INTEGRATION.md`)

## 1. In-Memory Credential Storage (`src/api/client.ts`)

In compliance with Part 9.3 of the specification:
- Sensitive JWT access tokens and refresh tokens are held in an **in-memory session closure** (`sessionState` in `src/api/client.ts`) rather than persisted in `localStorage`.
- Every request automatically attaches `Authorization: Bearer <accessToken>` and `X-Tenant-ID: <activeTenantId>` headers.
- On HTTP `401`, `apiRequest()` transparently attempts a single token rotation via `POST /api/v1/auth/refresh` before propagating an authentication error.

## 2. Standard Error Envelope Parsing (`src/api/errors.ts`)

All backend errors return the `ErrorEnvelope` schema (`{ error: { code, message, request_id, details } }`). `parseErrorEnvelope()` converts HTTP failures into `ApiClientError` instances exposing `code`, `requestId`, and `userFacingMessage` for accessible UI alert rendering.

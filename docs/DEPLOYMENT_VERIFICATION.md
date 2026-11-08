# Akademia AI — End-to-End Deployment Verification & Status Report

## 1. Local Docker Image & Compose Verification Summary

- **Frontend Image (`akademia-ai-frontend:local`)**: `sha256:f2c22e72cc2941d08f7f76dbae65ee4b1617a7ab009a86511de5fcf853e20642` (`74.6 MB`) — Verified healthy on standalone container (`127.0.0.1:8088`) and Docker Compose (`http://localhost:5175`).
- **Backend Image (`akademia-ai-backend:local`)**: `sha256:e3dfc9f8ea5cd1393276b178a75ed5d1137c3a5d32d7887bea72e048d4b7a8d4` — Verified healthy on `http://localhost:8000` (`61` OpenAPI paths).
- **Live E2E Multi-Tenant Proxy Check**: Verified user registration, JWT login, tenant creation (`1bde05cb-32bc-4bb2-896c-cc1e1bd287a8`), and course creation (`1e7ec52a-2a09-4c19-9b6f-8f1b3b7c0659`) through `http://127.0.0.1:5175/api/v1`.

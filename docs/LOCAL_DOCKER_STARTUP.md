# Akademia AI — Local Docker Compose Startup & Verification Report

## 1. Local Docker Compose Architecture (`compose.yaml`)

File: `c:\Users\LENOVO\AkademiaAI\akademia-ai-backend\compose.yaml`

| Container Name | Service | Image | Database Role / Identity | Host -> Container Port | Status |
|---|---|---|---|---|---|
| `akademia-postgres` | `postgres` | `pgvector/pgvector:pg16` | `postgres` (provisions `akademia_migrator`, `akademia_app`, `akademia_worker`, `akademia_readonly`) | `5436 -> 5432` | `Up (healthy)` |
| `akademia-redis` | `redis` | `redis:7.4-alpine` | N/A | `6386 -> 6379` | `Up (healthy)` |
| `akademia-migrator` | `migrator` | `akademia-ai-backend:local` | `akademia_migrator` (`CREATEDB BYPASSRLS` — migration role only) | Internal | `Exited (0)` (`alembic upgrade head`) |
| `akademia-api` | `api` | `akademia-ai-backend:local` | `akademia_app` (`NOSUPERUSER NOBYPASSRLS`), Linux UID `10001` (`akademia`) | `8000 -> 8000`, `8005 -> 8000` | `Up (healthy)` |
| `akademia-worker` | `worker` | `akademia-ai-backend:local` | `akademia_worker` (`NOSUPERUSER NOBYPASSRLS`), Linux UID `10001` (`akademia`) | Internal | `Up (healthy)` |
| `akademia-frontend` | `frontend` | `akademia-ai-frontend:local` | Nginx runtime + `/api/` reverse proxy to `http://api:8000` | `5175 -> 80` (port `3000` occupied on host by `ajohq-web`) | `Up (healthy)` |

## 2. Verified Local URLs

- **Frontend Application**: `http://localhost:5175` (`200 OK`)
- **Frontend SPA Deep Route**: `http://localhost:5175/learner/dashboard` (`200 OK`)
- **Frontend Health Check**: `http://localhost:5175/healthz` (`200 OK`)
- **Frontend-to-Backend Reverse Proxy**: `http://localhost:5175/api/v1/platform/health` (`200 OK`)
- **Backend API**: `http://localhost:8000` (`200 OK`)
- **OpenAPI Documentation**: `http://localhost:8000/api/v1/docs` and `http://localhost:8000/docs` (`200 OK`)

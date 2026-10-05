# AGENTS.md — Base44 Dev Environment

## Architecture
- **Backend**: Node.js / Express (`backend/src/server.js`), port 5000. PostgreSQL via `pg`.
- **Frontend**: Vite + React (`frontend/`), dev server on port 5173, mapped to host port 3000.
- **Database**: PostgreSQL 16 (`db` service in compose).
- **Wiring**: Single origin — Vite dev server proxies `/api` → `http://backend:5000`. `VITE_API_URL=/api`.

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api (via proxy) or http://localhost:5000/api (direct)

## Key Setup Notes
- **DB SSL**: The local Postgres container has no SSL. `DB_SSL=false` is set in compose to disable SSL entirely. The code (`backend/src/config/database.js`) supports `DB_SSL=false` — without it, `pg` always forces an SSL handshake that fails against a non-SSL server.
- **Missing base-table migration**: The original repo created `users`, `dealerships`, `car_brands`, `car_models`, `cars`, `car_images`, and `purchase_requests` manually in production with no migration. `backend/src/migrations/000_create_base_tables.js` was added to create them for fresh databases. Migrations run automatically on server startup (`server.js` calls `runMigrations()`).
- **Live reload**: Backend uses `node --watch`; frontend uses Vite HMR. Both bind-mount the source.
- **Admin guard**: `ADMIN_API_KEY` is unset in dev — write routes (POST/PUT/DELETE) are open. Set it to require `x-admin-key` header.

## Secrets (in `/run/base44/app.env`, not in repo)
- `JWT_SECRET` — required for auth token signing. A development placeholder is generated; replace with a real value for production.
- `SEARCHAPI_KEY` — optional, for car image search (searchapi.io).
- `ADMIN_API_KEY` — optional, protects write routes when set.
- `KAVENEGAR_API_KEY` — optional, for SMS notifications (Kavenegar).

## Local DB credentials (in compose `environment:`, not secrets)
- DB: `carplatform`, user: `carplatform`, password: `carplatform_dev`, host: `db`, port: 5432.

Plan: Incremental Enhancements for Multi-Service Client Management (Path B)

Goal
- Extend the MSP PBX Dashboard to support per-client management of multiple services (PBX, Internet, Wifi, Router) via a single, JWT-protected API service. Ensure the current deployment remains functional and can be pushed to production with minimal risk. 

Current State (as of this patch)
- New Clients API service added (JWT-protected) with: 
  - /api/auth/login for issuing JWTs
  - /api/clients and /api/clients/:id endpoints to manage clients and their services
  - Service data stored in SQLite with two tables (clients, services)
  - Encryption utility scaffolding for sensitive fields (ENCRYPTION_KEY required)
- Frontend refined to a multi-service per-client UI (PBX, Internet, Wifi, Router) integrated with the new API surface (via VITE_API_BASE_URL in Docker)
- Health endpoint added to the new service for quick smoke checks: GET /health
- Environment wiring updated to support JWT_SECRET, ADMIN_USER, ADMIN_PASSWORD, ENCRYPTION_KEY

Important: The old /api/pbx endpoints remain working and are not broken by these changes. The new /api/clients surface is additive.

Plan: 24 Task Milestones (numbered)

1) Stabilize health endpoint and basic smoke checks
- Add: GET /health on the clients service (done)
- Acceptance: curl http://<host>:<port>/health returns { status: "ok", time: ... }

2) Harden environment and deployment defaults
- Add: Documentation for required env vars (ENCRYPTION_KEY, JWT_SECRET, ADMIN_USER, ADMIN_PASSWORD)
- Ensure docker-compose wiring defaults won’t reveal secrets in logs
- Acceptance: Build and run with a fresh env and verify endpoints respond

3) JWT auth expansion
- Add: /api/auth/login that uses ADMIN_USER and ADMIN_PASSWORD
- Middleware: Protect /api/clients/* endpoints with JWT
- Acceptance: curl POST to login returns a token; use token to hit /api/clients

4) DB schema and data layer polish
- Ensure db.js and migrations are idempotent; tests for create/get/update/delete flows for clients/services
- Acceptance: Create a test client and a couple of services; read back data, ensure encryption pipeline works for sensitive fields (requires ENCRYPTION_KEY)

5) Frontend integration polish (MVP to production quality)
- Expand per-client UI to include: PBX, Internet, Wifi, Router sections with real input fields and per-section save actions
- Add input validation (basic pattern checks: IPs, required fields) and UX hints
- Add error handling states (loading, success, error toasts)
- Acceptance: Build frontend, run in Docker, login, create a client, and add/update 4 services successfully

6) End-to-end validation in CI-like flow (local smoke tests)
- Validate: docker-compose up -d; curl login; create a client; add 4 services; fetch client; verify fields
- Acceptance: All steps complete without error in a clean environment

7) Migration strategy planning (Phase 2 future)
- If/when desired, plan for a DB-backed migrations path with a proper schema for all entities and a stable API contract
- Acceptance: Drafted migration plan and rough schema

8) Optional UX polish
- Add per-client cards in a unified dashboard with counts per service type
- Add simple search/filter for clients
- Acceptance: UI polish passes basic usability checks

9) Security hardening in production
- Add token refresh, rotate encryption keys, secrets in a vault, TLS termination strategy via reverse proxy
- Acceptance: Security plan documented and initial changes applied

10) Documentation
- Update root README with: how to run, how to test, env vars, and how to extend
- Acceptance: Documentation matches current setup and how to extend

Notes for future work (in Tak list)
- Add per-service deletion confirmation and audit logs
- Add per-client dashboards with historical service state changes
- Add role-based access control for API endpoints
- Add server-side validation for service data payloads

Next steps (recommendation)
- Pick up Task 3 (JWT auth) if you want to accelerate secure access; Task 4 (DB polish) is optional but recommended before production.
- After each milestone, perform the smoke test described in Acceptance bullets and push changes on a dedicated branch (e.g., feature/clients-multi-service)

End of Plan

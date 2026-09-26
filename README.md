# Team Access Control API

A production-style multi-tenant **IAM (Identity & Access Management) backend** — the kind of system that sits behind every real SaaS product, built to demonstrate backend engineering depth beyond basic CRUD: authentication with refresh token rotation, role-based access control with a real permission catalog, multi-tenant data isolation, session management, and audit logging.

Built with **Node.js, TypeScript, Express, PostgreSQL, Prisma, Redis and Docker**.

---

## Why this project

Most backend portfolio projects stop at "users can log in and CRUD a resource." This one is built around the problems that actually come up in production SaaS backends:

- How do you isolate one customer's data from another's in a shared database?
- How do you model *who can do what*, and let that change per organization without touching code?
- How do you detect a stolen refresh token, not just expire it?
- How do you make every sensitive action traceable after the fact?

Every design decision below exists to answer one of those questions.

---

## Features

### Auth
- Register → email verification → login
- Short-lived JWT access tokens (15 min) + long-lived opaque refresh tokens (7 days)
- **Refresh token rotation with reuse detection** — a replayed, already-rotated refresh token revokes the entire session chain, not just itself
- Refresh and reset tokens are **hashed before storage** — a database leak alone never exposes a usable token
- Forgot/reset/change password, logout, logout-all-devices
- Passwords hashed with Argon2id

### Organizations (multi-tenancy)
- Creating an organization auto-provisions 5 system roles (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`) and assigns each its default permission set — all in a single transaction
- Every organization-scoped query is derived from a verified membership row, never from a client-supplied ID alone — the core defense against IDOR and cross-tenant access

### RBAC (Roles & Permissions)
- A resolvable permission catalog (`resource.action` naming — e.g. `members.remove`, `organization.delete`) rather than hardcoded role-name checks
- Custom, per-organization roles in addition to the 5 system roles
- Fine-grained permission assignment per role, including a **replace-all** endpoint for building a permissions UI
- Guardrails baked into the service layer, not just the database: system roles can't be renamed or deleted, a role in use can't be deleted, and only an `OWNER` can grant "dangerous" permissions (`organization.delete`, `roles.update`, `permissions.assign`, `members.remove`) — closing the privilege-escalation path an `ADMIN` would otherwise have

### Members & Invitations
- Secure, hashed, expiring invitation tokens tied to a specific org + email + role
- An org can never end up with zero owners — removal, role changes, and self-service "leave" are all blocked if they'd demote or remove the last `OWNER`
- Every membership mutation writes an audit log entry

### Authorization middleware
- A reusable, five-step chain applied to every organization-scoped route:
  `authenticate → loadOrganizationContext → requirePermission → validate → business rules`
- Permission resolution (role → RolePermission → Permission) happens once per request and is attached to `req`, not re-queried by every downstream layer

### Sessions
- Every login creates a durable session row (device, IP, user agent, timestamps)
- List, inspect, and revoke sessions individually, in bulk ("all others"), or entirely
- Demonstrates the real tradeoff between stateless JWTs (fast, can't be instantly revoked) and the session-backed refresh token (the actual point of control)

### Audit Logs
- Append-only log of sensitive actions (logins, role changes, member removals, invitation lifecycle events) capturing actor, organization, target, IP, user agent, and metadata
- *(Read/list endpoints in progress — see Roadmap)*

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 (driver adapter, `@prisma/adapter-pg`) |
| Cache / rate limiting | Redis |
| Auth | JWT (access) + opaque hashed tokens (refresh) |
| Password hashing | Argon2id |
| Validation | Zod |
| Testing | Jest + Supertest *(in progress)* |
| Docs | Swagger / OpenAPI *(in progress)* |
| Containerization | Docker + Docker Compose *(in progress)* |

---

## Architecture

Modular monolith, feature-based folder structure, strict layering:

```
Controller  → parses the request, calls the service, shapes the response
Service     → business rules, transactions, orchestration
Repository  → Prisma queries only, no business logic
Middleware  → authentication, tenancy, and permission checks
```

Every organization-scoped request flows through the same authorization chain:

```
authenticate            verify the JWT, attach req.user
loadOrganizationContext verify membership in :organizationId, resolve permissions
requirePermission        check the resolved permission set
validate                 zod schema check on params/query/body
[controller → service → repository]
audit log write          on success, for sensitive actions
```

---

## API overview

| Module | Endpoints |
|---|---|
| **Auth** | register, verify-email, login, refresh, logout, logout-all, me, forgot/reset/change password |
| **Organizations** | create, list mine, get, update, delete |
| **Members** | list, get, update role, remove, leave |
| **Invitations** | create, list, get, cancel, resend, accept (token), reject (token) |
| **Roles** | list, get, create (custom), update, delete |
| **Permissions** | list catalog, get one |
| **Role-Permissions** | list for role, assign, remove, replace-all |
| **Sessions** | list, get, revoke one, revoke others, revoke all |
| **Audit Logs** | *(read endpoints in progress)* |

Every organization-scoped route requires membership in that organization and the relevant permission — enforced by middleware, not by convention.

---

## Getting started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis *(required once rate limiting lands — not yet wired in)*

### Setup

```bash
git clone <your-repo-url>
cd team-access-control-api
npm install
```

Create a `.env` file:

```dotenv
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/team_access_control_db?schema=public"

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

NODE_ENV=local
```

Run migrations and seed the permission catalog:

```bash
npx prisma migrate dev
npx prisma db seed
```

Start the dev server:

```bash
npm run dev
```

Server runs at `http://localhost:5000`. Health check at `GET /health`.

---

## Project structure

```
src/
  config/        env, database client, permission catalog
  middlewares/    authenticate, authorization (loadOrganizationContext, requirePermission),
                  validation, error handling, response formatting
  modules/
    auth/
    organizations/
    members/
    invitations/
    roles/
    permissions/
    role-permissions/
    sessions/
  types/          Express type augmentations
  utils/
  app.ts
  server.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
```

Each module follows: `*.types.ts → *.validation.ts → *.repository.ts → *.service.ts → *.controller.ts → *.route.ts`

---

## Security notes

- Refresh tokens, password-reset tokens, and invitation tokens are all generated with `crypto.randomBytes` and stored as SHA-256 hashes — never in plaintext
- Refresh token reuse (a token used after it's already been rotated) revokes the entire session chain immediately, not just the one token
- Multi-tenant queries are always scoped through a verified membership lookup — organization IDs from the client are never trusted directly
- Passwords are Argon2id-hashed; sensitive endpoints never log tokens or passwords
- Deleting the last `OWNER` of an organization is blocked at every entry point (removal, role change, self-leave)

---

## License

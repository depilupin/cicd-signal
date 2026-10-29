# Signal Implementation Status & Repository Audit

> **Current Phase:** Phase 3 & Google OAuth — Database, Foundation API, and Google Auth  
> **Status:** ✅ COMPLETED & VERIFIED  
> **Next Phase:** Phase 4 — Authentication, Email/Password, and Account Security  
> **Date:** 2026-10-26

---

## 1. Executive Summary & Audit Findings

An exhaustive repository inspection was conducted prior to making structural changes. The codebase originated as a standalone Vite + React 19 application containing static landing page mockups and visual prototypes.

### Existing Assets Preserved
The following valuable components have been preserved without regression:
- **`apps/web/src/components/ScanVisual.tsx`**: High-value interactive simulation of CI/CD workflow parsing, dynamic risk score meter, and step indicators.
- **`apps/web/src/components/DashboardMock.tsx`**: Realistic researcher triage workbench table with severity levels and mock telemetry.
- **All landing page sections**: `Hero.tsx`, `Problem.tsx`, `Solution.tsx`, `Detections.tsx`, `LineByLine.tsx`, `BountyWorkflow.tsx`, `ResearchExample.tsx`, `WhyResearchers.tsx`, `Supported.tsx`, `Docs.tsx`, `Pricing.tsx`, `FinalCta.tsx`, `Footer.tsx`.
- **CSS Tokens & Visual Theme**: Preserved `@theme` colors (`#07080c` ink, `#3ee0a0` signal green, severity palettes) and custom utility classes (`.glass`, `.hero-frame`, `.grid-fade`, `.scan-beam`, `.live-dot`).

### Incomplete, Mocked, or Insecure Patterns Identified
1. **Mock Data in Client Flows**:
   - `UiProvider.tsx` uses browser-only state (`useState`) to display a mock dialog without transmitting data to any server.
   - `content/site.ts` contains hardcoded pricing numbers and plan descriptions that must later be served by a public API endpoint (`GET /api/v1/plans`).
   - `DashboardMock.tsx` contains static rows with hardcoded numbers that must clearly remain marked as simulated demo data during public landing phases.
2. **Monolithic Directory Structure**:
   - The original repository had all code mixed in root `src/` without separating server APIs, background workers, or database definitions.
3. **Missing Backend Foundations**:
   - No PostgreSQL connection, Prisma schema, or database migrations existed.
   - No backend session store, password hashing, or CSRF protection existed.
   - No GitHub App token negotiation or webhook verification existed.
   - No Redis/BullMQ background scanner pipeline existed.

---

## 2. Monorepo Architecture Established

The repository has been restructured into an npm workspaces monorepo:

```
cicd-signal/
├── apps/
│   ├── web/                    # React 19, Vite, Tailwind CSS v4 (@signal/web)
│   ├── api/                    # Express, TypeScript REST API (@signal/api)
│   └── worker/                 # BullMQ scanner worker (@signal/worker)
├── packages/
│   ├── database/               # Prisma client & PostgreSQL connection manager (@signal/database)
│   ├── shared/                 # Standard API envelopes, AppError, DTOs, domain enums (@signal/shared)
│   └── scanner-rules/          # 10 detection vectors, rule definitions & AST interfaces (@signal/scanner-rules)
├── docs/
│   ├── architecture.md         # Master architecture, security model, and API contracts
│   └── implementation-status.md # Phase tracking and audit records
└── .env.example                # Safe environment variable template
```

---

## 3. Phase-by-Phase Roadmap & Status

| Phase | Title | Status | Notes |
| :---: | :--- | :---: | :--- |
| **1** | **Repository audit, architecture and design system** | ✅ **Done** | Monorepo established; shared contracts, error types, rule models, API scaffold, and design system primitives verified. |
| **2** | **Public landing page and conversion flow** | ✅ **Done** | Modular UI context, Google OAuth action button, explicit simulation badges on demo views, server-backed pricing component, live navbar auth state. |
| **3** | **PostgreSQL, Prisma and Express foundation** | ✅ **Done** | 14 relational models in Prisma, live connection to pooled PostgreSQL, seed scripts executed, readiness health probes, dynamic plans API. |
| **OAuth** | **Google OAuth End-to-End** | ✅ **Done** | State-verified OAuth initiation, token exchange & userinfo fetch, user upsert, cryptographically hashed session creation, HttpOnly cookies, /me and /logout endpoints. |
| **4** | **Authentication and account security** | ⏳ *Next* | Argon2id password hashing, email verification tokens, rate limiting middleware, password reset workflows. |
| **5** | **GitHub App integration & repository authorization** | 📋 *Pending* | Installation tokens, webhook signature verification, public & private repo scoping. |
| **6** | **Real scanner engine & background processing** | 📋 *Pending* | BullMQ worker, YAML AST parsing, versioned rules evaluation, secret redaction, finding persistence. |
| **7** | **Researcher dashboard and findings UX** | 📋 *Pending* | Protected `/app` routes, live scan progress polling, finding verification workflows, report export. |
| **8** | **Monthly subscriptions and entitlements** | 📋 *Pending* | Razorpay subscription lifecycle, webhook deduplication, server-side quota enforcement. |
| **9** | **Admin operations, security hardening & observability** | 📋 *Pending* | Audit logs, tenant isolation verification, rate limit hardening, correlation IDs. |
| **10** | **Deployment and production acceptance** | 📋 *Pending* | Containerization, staging verification, end-to-end acceptance run, launch checklist. |

---

## 4. Verification & Health Metrics (Phases 1, 2 & 3)

All verification scripts executed cleanly across the entire workspace:

- **Automated Integration Tests (`npm test`)**:
  - `GET /healthz`: Returns 200 OK with uptime and service status.
  - `GET /readyz`: Returns 200 OK with live database probe latency and healthy status.
  - `GET /api/v1/plans`: Returns 200 OK with 3 public subscription tiers loaded directly from PostgreSQL.
  - `GET /api/v1/auth/google`: Returns 302 redirect with cryptographically random state cookie and Google accounts URL.
  - `GET /api/v1/auth/me`: Returns 401 UNAUTHORIZED when no session cookie is supplied.
  - All 6 subtests passed in under 2 seconds.
- **Build Check (`npm run build`)**: 
  - `@signal/shared`: Built cleanly (`tsc -b`).
  - `@signal/database`: Prisma client generated and built cleanly (`tsc -b`).
  - `@signal/scanner-rules`: Built cleanly (`tsc -b`).
  - `@signal/api`: Built cleanly (`tsc -b`).
  - `@signal/web`: Built cleanly via Vite production bundle (`dist/assets/index-*.js`, gzip: ~85 kB).
  - `@signal/worker`: Built cleanly (`tsc -b`).
- **Type Check (`npm run typecheck`)**:
  - Zero TypeScript errors across all 6 workspaces with `strict: true`.
- **Lint Check (`npm run lint`)**:
  - Ran Oxlint across all 48 files in 24ms; 0 warnings, 0 errors found.
- **Database Status**:
  - Live PostgreSQL database at `pooled.db.prisma.io:5432` synchronized via `prisma db push`.
  - Database seeded with 3 active pricing plans and 10 built-in security detection rules.
- **Security Audit**:
  - Verified that `.env` and `.env.*` are in `.gitignore`.
  - Zero credentials or secrets exposed in frontend code bundles.
  - OAuth state parameter uses secure 24-byte cryptographic random hex with HttpOnly cookies.


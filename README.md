# ThriftCircle — Backend

Backend service for ThriftCircle, a digital platform that modernizes Ajo/Esusu
(rotating savings group) management for Nigerian and African savings
communities. Built by Group 10, TechCrush Cohort 7 — Backend Track.

## What ThriftCircle Does

Ajo/Esusu groups are informal rotating savings arrangements: a fixed number
of people each contribute a fixed amount on a fixed schedule, and one person
collects the full pot each round until everyone has had exactly one turn.
Traditionally these are run on trust, WhatsApp threads, and notebooks — which
creates disputes over who's paid, confusion about payout order, and no
neutral record when something goes wrong.

ThriftCircle does not hold or move money. Contributions happen the way they
always have (bank transfer, cash) — the platform's job is to track who owes
what, confirm payments with proof, automate the payout rotation, and give
every participant a transparent, dispute-resistant record.

Full product context: PRD (`docs/PRD.md` or wherever the team has filed it)
and `NOTES.md` in this repo, which explains every database model against
both the real-world mechanic it represents and the product requirement it
satisfies.

## Team

Backend Track, Group 10, TechCrush Cohort 7.

- **Michael Bamidele Ipadeola** ([@devobams](https://github.com/devobams)) —
  Lead. Schema ownership (full sprint), Auth (registration, login,
  password reset), Groups core logic, Invites/Join-Requests design,
  Contributions rotation engine, Payouts module, file upload integration,
  PR review across all modules.
- **Cherechi Dimobika** ([@cherechi-18](https://github.com/cherechi-18)) —
  Back-Office: Admin account management, group assignments, scoped
  dispute handling, platform analytics.
- **Simon Ebelethe** ([@ebelethe](https://github.com/ebelethe)) — Groups
  module (creation, group detail), Invites module, Join-Requests
  implementation (request/approve/reject, slot selection).
- **Israel Ademu Elias** ([@Elias768-collab](https://github.com/Elias768-collab)) —
  Contributions (pay/confirm/reject), Dashboard aggregation, Cycle
  reports.

## Tech Stack

- **Runtime:** Node.js, Express.js (ESM — `"type": "module"`, `.js` extensions
  on all relative imports)
- **Database:** PostgreSQL, via Prisma ORM
- **Auth:** JWT (jsonwebtoken), bcrypt for password hashing
- **Validation:** Zod on every route accepting a request body
- **File storage:** Cloudinary (proof-of-payment uploads), via Multer
  (memory storage — files are streamed to Cloudinary, never written to disk)
- **Caching / Jobs:** Redis (reserved for the reminder job)
- **Testing:** manual, via Postman — see Postman collection ([POSTMAN COLLECTION](https://documenter.getpostman.com/view/34651223/2sBY4TrJgF))

## Role Model

Four distinct roles, each with a different scope of access:

| Role | Created via | Scope |
|---|---|---|
| Super Admin | Seeded at platform setup, never via API | Entire platform; only role that can create Admin accounts |
| Admin | Created by Super Admin only | Assigned groups only — enforced server-side on every request, never a blanket "all groups minus Super Admin" grant |
| Organizer | Public registration | Owns and runs their own group(s); participates in their own group's rotation (holds slot 1 by default) |
| Member | Public registration, joins via invite code + approval | Own contributions and group memberships only |

## Core Product Flow

1. Organizer registers, creates a group (contribution amount, total slots,
   frequency, optionally a planned start date).
2. Organizer generates an invite code for the group.
3. A prospective member registers an account (no invite code required at
   registration — joining is a fully separate step) and resolves the invite
   code to preview the group before committing.
4. Member submits a join request against that code.
5. Organizer reviews pending requests and approves or rejects.
6. Once approved, the member picks their own available payout slot
   (first-come-first-served; slot 1 is always the Organizer's).
7. Once every slot is filled, the Organizer starts the rotation. This
   generates every round's schedule, every member's contribution
   obligation for every round, and the payout order, all at once, up
   front — not incrementally per round.
8. Each round, members upload proof of payment; the Organizer confirms or
   rejects each submission.
9. Once every contribution in a round is confirmed, the Organizer records
   that round's payout to whoever holds that round's slot.
10. This repeats until every member has both fully paid in and collected
    their one payout — a complete rotation.

Every status change (contribution confirmed/rejected, payout recorded) is
logged with a timestamp and the acting user, per the platform's audit-trail
requirement.

## Architecture

Modular monolith, organized by feature rather than by technical layer. Each
module is self-contained and follows the same internal layering:

```
routes -> controller -> service -> model -> Prisma -> Postgres
```

- **routes** — wires HTTP method + path to a controller function, attaches
  middleware (`authenticate`, `authorize`, upload handling)
- **controller** — thin HTTP layer: parses the request via a Zod schema,
  calls the service, shapes the response. No business logic.
- **service** — business logic: ownership checks, state-transition rules,
  orchestration across multiple model calls, transactions
- **model** — thin Prisma query wrappers only, no business logic

This separation means a bug in *what* an action does lives in a service
file, and a bug in *how* the HTTP layer behaves lives in a controller —
each is fast to isolate.

## Folder Structure

```
src/
├── app.js                  # Express app setup, middleware, error handler
├── server.js                # server bootstrap
├── config/
│   ├── env.js                # validated environment variable loading
│   ├── prisma.js             # shared Prisma Client instance
│   ├── redis.js
│   └── cloudinary.js          # Cloudinary SDK config
├── middleware/
│   ├── authenticate.js        # JWT verification
│   ├── authorize.js           # role-based access control
│   ├── scopeToAssignedGroups.js  # Admin group-scoping enforcement
│   ├── uploadMiddleware.js    # Multer config for file uploads
│   └── errorHandler.js        # centralized error formatting
├── modules/
│   ├── auth/                  # registration, login, password reset
│   ├── groups/                 # group creation, group detail
│   ├── invites/                 # invite code generation, resolution, regenerate/disable
│   ├── join-requests/            # request-to-join, approval, slot selection
│   ├── contributions/            # rotation generation, pay/confirm/reject, contribution listing
│   ├── payouts/                 # payout plan reads, payout execution
│   ├── back-office/              # Super Admin admin management, Admin dispute handling, analytics
│   └── dashboard/                # organizer dashboard, cycle reports
├── jobs/
│   └── reminderJob.js          # scheduled due-date/overdue reminder job
├── routes/
│   └── index.js                # mounts every module's router
└── utils/
    ├── asyncHandler.js         # wraps async controllers, forwards errors to errorHandler
    ├── sanitizeUser.js          # strips passwordHash recursively from any response
    └── uploadToCloudinary.js    # streams a file buffer to Cloudinary
```

`jobs/` sits at the top level, not nested inside `modules/`, because a
scheduled job reaches across multiple modules (Contributions,
Notifications) rather than belonging to one.

## Database

See `prisma/schema.prisma` for the authoritative schema, and `NOTES.md` for
a full explanation of every model — what it represents in the real world,
why it's shaped the way it is, and what product requirement it satisfies.
Schema is owned by one person for the duration of the build; nobody else
edits `schema.prisma` directly (see `CONTRIBUTING.md`).

Key models: `User`, `Group`, `GroupMember`, `Invite`, `JoinRequest`,
`AdminGroupAssignment`, `ContributionCycle`, `Contribution`,
`ContributionStatusLog`, `PayoutOrder`, `Payout`, `Dispute`, `Notification`.

Notably, payout scheduling (`PayoutOrder` — who is due to receive, and
when) is modeled separately from payout execution (`Payout` — whether it
actually happened, who recorded it, what reference/proof exists) — these
are different facts in any real financial system and are tracked
independently.

## Setup

### Prerequisites
- Node.js
- Docker (for local Postgres and Redis)
- A Cloudinary account (free tier is sufficient) for file upload

### Steps

1. Clone the repository and install dependencies:
   ```
   git clone [ThriftCircle-Backend](https://github.com/devobams/ThriftCircle-Backend)
   cd ThriftCircle-Backend
   npm install
   ```

2. Start local Postgres and Redis:
   ```
   docker compose up -d
   ```

3. Copy the environment template and fill in real values:
   ```
   cp .env.example .env
   ```
   Required variables:
   - `DATABASE_URL` — Postgres connection string
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `REDIS_URL`
   - `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_PASSWORD` — used by the seed script
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

4. Run migrations and seed the database:
   ```
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Start the dev server:
   ```
   npm run dev
   ```

6. Confirm it's running:
   ```
   GET http://localhost:4000/health
   ```
   should return `{ "status": "ok" }`.

### If you're pulling an update that touched the schema

Check the relevant PR description first — a schema change that renames or
removes a field may require `npx prisma migrate reset` rather than a plain
`npx prisma migrate dev`, since a plain migrate can't reconcile certain
changes against existing local data. When in doubt, reset — this is a
development database, not production data.

## API Reference

Base URL: `/api/v1`

Full endpoint-by-endpoint documentation, request/response shapes, and
access rules: see `API_CONTRACT.md`. A Postman collection covering every
endpoint, including sad-path/error cases, is available at
([POSTMAN COLLECTION](https://documenter.getpostman.com/view/34651223/2sBY4TrJgF))

## Authentication

JWT-based. Obtain a token via `POST /auth/register` or `POST /auth/login`,
then include it on every subsequent request:
```
Authorization: Bearer <token>
```

Role checks (`authorize`) confirm the caller holds a given role. Ownership
checks, layered on top where relevant (e.g. "is this caller the organizer
of *this specific* group," "is this caller a member of *this specific*
group"), live in each module's service layer — a role alone is never
sufficient to access another user's specific group, contribution, or
dispute data.

## File Uploads

Proof-of-payment submission (`POST /contributions/:id/pay`) accepts a real
file via `multipart/form-data`, field name `proof`. Accepted types: JPEG,
PNG, WEBP, PDF. Maximum size: 5MB. Files are streamed directly to
Cloudinary and never written to local disk; the resulting hosted URL is
what's stored against the contribution record.

## Known Limitations (MVP scope)

- **Reminders:** the scheduled due-date/overdue reminder job exists as
  scaffolding (`src/jobs/reminderJob.js`) but is not yet wired to an
  actual cron scheduler or sending real notifications.
- **Invite delivery:** invite codes are generated and validated, but there
  is no in-app SMS/email delivery mechanism — organizers share codes
  manually outside the platform.
- **Organizer-assigned payout positions:** the schema reserves a value
  (`organizer_assigned`) for organizers to pre-assign member slots rather
  than members self-selecting, but this mode is not implemented — every
  group currently behaves as self-selected.
- **Pagination:** list-style endpoints (schedules, dashboards) do not
  paginate; acceptable at MVP data volumes, a real concern at scale.
- **Report export (PDF/CSV):** cycle reports are available as JSON;
  file-format export was explicitly scoped as a Should-Have, not required
  for MVP.

Full history of design decisions, corrections, and parked items:
`NOTES.md`.

## Contributing

Branching model, commit conventions, schema-ownership rules, and how to
avoid being blocked on another module's work: see `CONTRIBUTING.md`.

Summary:
- `main` — production, protected, no direct pushes
- `dev` — integration branch; all feature work branches off this
- Branch naming: `feature/<short-description>`, `fix/<short-description>`
- One feature branch per task; commits should be chunked and individually
  meaningful, not one large commit per PR
- Every PR description should state what it does, which module/endpoint
  it maps to, and how it was tested

## Team

Backend Track, Group 10, TechCrush Cohort 7.

- Schema ownership, Auth, Groups core logic, Invites/Join-Requests design,
  Contributions rotation engine, Payouts — [Lead]
- Groups module, Invites, Join-Requests implementation — [Dev 2]
- Contributions (pay/confirm/reject), Dashboard, Reports — [Dev 3]
- Back-Office (Admin management, disputes, analytics) — [Dev 4]

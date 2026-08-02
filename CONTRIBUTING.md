# Contributing to ThriftCircle Backend

This is the single reference for how our team works day-to-day. If you're
unsure how to proceed on something, check here first before asking in chat.

## 1. Schema Ownership — Read This First

`prisma/schema.prisma` is owned by **one person — the Lead — for the entire
two-week sprint.** Nobody else edits this file directly, ever, even "just to
unblock quickly."

**Why:** if multiple people edit the schema independently and push at
different times, Prisma's migration history goes out of sync between
machines. The errors this produces are confusing even for experienced
developers. One owner removes this failure mode completely.

**If you need a field or table that doesn't exist:** message the Lead (group
chat or a quick call) and request it. Don't add it yourself.

## 2. Daily Setup — Pulling Schema Changes

Every team member runs their **own** local Postgres + Redis via Docker —
schema ownership means one shared *source of truth* for table structure,
not one shared database. Your data stays on your machine.

After the Lead pushes schema changes to `dev`:

```bash
docker compose up -d       # start your local Postgres + Redis containers
git pull origin dev        # get the latest schema.prisma + migrations
npx prisma generate        # regenerate Prisma Client to match the schema
npx prisma migrate dev     # apply the migration to YOUR local database
```

`npx prisma migrate dev` is safe for everyone to run — it only *creates* a
new migration file if you've personally changed `schema.prisma`. Since only
the Lead touches that file, when you run this command it just applies the
migration files already sitting in `prisma/migrations/` (pulled via git) to
your local database. Nothing conflicts.

## 3. Git Workflow
main → always deployable, protected, no direct pushes
└─ dev → integration branch, all feature branches merge here first
└─ feature/<short-description>
└─ fix/<short-description>

- **Branch off `dev`, never off `main`.**
- **One feature branch per task** — e.g. `feature/auth-register-organizer`,
  `feature/groups-create-endpoint`.
- **PR into `dev`.** `dev` merges to `main` only at the end of the sprint,
  after a working demo.
- **Never commit `.env`** — use `.env.example` as the template.

### Commit messages

Format: `[module] short description`

Examples:
[auth] add register endpoint for organizer and member intents
[groups] add invite generation and join flow
[schema] add Payout model and totalSlots on Group

Keep commits **chunked and meaningful** — one logical change per commit, not
one giant "final changes" commit at the end of a task.

### PR descriptions

Every PR should state:
1. **What it does** — plain description of the change.
2. **Which module / PRD row / API contract row it maps to** — so reviewers
   can check it against the spec, not just read code in isolation.
3. **How it was tested** — Postman screenshot, curl example, or steps to
   reproduce.

## 4. Module Ownership (Week 1)

| Person | Owns |
|---|---|
| Lead | Module A — Auth & Identity, plus schema ownership |
| Dev 2 | Module B — Groups & Membership (incl. Invites) |
| Dev 3 | Module C — Contributions & Payouts |
| Dev 4 | Module E — Back-Office (Admin/Super Admin) |

Module D (Dashboards, Reminders, Reports) has no dedicated owner in Week 1 —
it depends on B and C's data existing first. Dev 4 picks it up in Week 2
once Back-Office's Week 1 scope is done.

## 5. Don't Wait Idle — Use Stubs and Test Tokens

You are **not** blocked on the Lead finishing Auth's business logic. You're
only blocked on two things, both done Day 1: the schema existing, and
`JWT_SECRET` being set (already in `.env.example`).

**To protect a route before real login exists:**
`authenticate.js` / `authorize.js` only need a valid JWT signed with the
shared `JWT_SECRET` — they don't need `registerUser`/`loginUser` to be
finished. Mint yourself a throwaway token:

```bash
node -e "console.log(require('jsonwebtoken').sign({id:'test-id', role:'organizer'}, process.env.JWT_SECRET))"
```

Paste it into Postman's `Authorization` header to test protected routes.

**If you need a real row to satisfy a foreign key** (e.g. `organizer_id` on
a `Group`), insert one directly via `npx prisma studio` rather than waiting
on the real registration flow.

## 6. House Rules

- Every route accepting a body gets a **Zod schema** — no exceptions, even
  for "simple" endpoints.
- Passwords are **always** hashed with bcrypt before storage — never stored
  or logged in plain text.
- JWTs carry `id` and `role` — that's what `authorize.js` checks. Don't
  bypass it by trusting a role sent in the request body.
- No raw SQL string concatenation — Prisma only.
- `snake_case` in the database, `camelCase` in JS.
- All secrets/config through `.env`, never hardcoded.
- Definition of Done: code merged, endpoint manually tested in Postman, no
  console errors, input validation in place.

## 7. Getting Unstuck

If you're blocked and it's not covered above — post in the group chat with
what you tried and what broke. Don't sit on it silently; the whole point of
the module split is that most blockers should be solvable without waiting
on someone else (see Section 5).
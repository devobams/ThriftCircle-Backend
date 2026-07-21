# ThriftCircle Backend — API Contract (v3)

Base URL: `/api/v1`

This is v3 of the contract, updated against:
- Schema v3 (Payout/PayoutOrder split, `Group.totalSlots`)
- Real-world Ajo mechanics research (rotation slots, one-payout-per-round)
- PRD v1.0 Section 7 (User Stories)

## 0. What Changed From v2, and Why

| Change | Reason |
|---|---|
| `POST /groups` now requires `total_slots` | Locks the rotation size at creation — see NOTES.md Section 3 (`Group.totalSlots`) |
| `GET /groups/:id` and `GET /invites/:code` now return slot availability | Lets the frontend show "7/10 filled" and prevents a wasted join attempt |
| `POST /groups/:id/join` can now return `409 Conflict` | New failure mode: group is full |
| Payout endpoints split into **plan** (`payout-order`) vs **execution** (`payouts`) | Matches the schema split — a designated recipient vs. a confirmed money movement are different facts |

## 1. Design Decision: Slot Capacity Enforcement

**Where it's enforced:** application/service layer, not the database schema.
A schema constraint (unique, FK, not-null) governs a single row; "reject this
insert if the group's member count already equals `totalSlots`" is an
aggregate check evaluated at insert time — which belongs in
`groups.service.js`, inside a `prisma.$transaction()` (count members, then
create the `GroupMember` row, in the same transaction, to shrink the race
window).

**What this means practically for whoever builds the join endpoint:**
1. Look up the group's `totalSlots`.
2. Count existing `GroupMember` rows with `joinStatus: active` (or
   `invited`, depending on whether an outstanding invite should also count
   against capacity — team decision, default: count `active` only for MVP).
3. If count >= `totalSlots` → `409 Conflict`, `{ message: "This group is
   already full" }`.
4. Otherwise, create the row.

**Known limitation (documented, not solved in MVP):** two people joining in
the same instant could both pass step 2 before either commits step 4. A full
fix needs row-level locking, which is more than this sprint needs — flag it
in the PR description so it's a known, intentional tradeoff, not a silent
gap.

---

## 2. Auth & Invites

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | `intent: "organizer"` or `intent: "member"` (member requires `invite_code`) |
| `GET` | `/invites/:code` | Public | Resolve invite → group preview, **including slot availability** |
| `POST` | `/auth/login` | Public | All 4 roles, same endpoint |
| `GET` | `/auth/me` | Authenticated | Returns role + (if Admin) assigned group IDs |

### `GET /invites/:code` — response shape (updated)

```json
{
  "group_name": "Aunt Funmi's Group",
  "organizer_name": "Funmi A.",
  "contribution_amount": 5000,
  "frequency": "weekly",
  "total_slots": 10,
  "slots_filled": 7,
  "slots_available": 3,
  "invite_status": "pending"
}
```

**Why this matters:** this is the frontend's chance to show slot progress
*before* the person even signs up — matches your "see progress of slots
remaining" instinct directly. If `slots_available` is 0, the frontend can
disable the join CTA before the person wastes a signup attempt.

---

## 3. Groups & Membership

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/groups` | Organizer | Create group — **now requires `total_slots`** |
| `GET` | `/groups/:id` | Member of group | Group details, **including slot availability** |
| `POST` | `/groups/:id/invites` | Organizer | Generate invite link/code |
| `POST` | `/groups/:id/join` | Authenticated, has invite code | Join existing group — **can now return 409 if full** |
| `GET` | `/groups/:id/members` | Member of group | List members |

### `POST /groups` — request body (updated)

```json
{
  "name": "Aunt Funmi's Group",
  "contribution_amount": 5000,
  "total_slots": 10,
  "frequency": "weekly",
  "payout_order_type": "fixed"
}
```

`total_slots` is **required**, validated by Zod as a positive integer with a
sane upper bound (e.g. `z.number().int().min(2).max(100)` — matches PRD
Section 8's scalability NFR: "support groups from 5 to 100+ members").

### `POST /groups/:id/join` — new failure mode
409 Conflict
{ "message": "This group is already full" }

This is the endpoint where the slot-capacity check from Section 1 actually
runs.

### `GET /groups/:id` — response now includes

```json
{
  "...": "existing fields",
  "total_slots": 10,
  "slots_filled": 7,
  "slots_available": 3
}
```

---

## 4. Contributions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/groups/:id/schedule` | Member of group | Contribution schedule across all rounds |
| `POST` | `/contributions/:id/pay` | Member | Mark as paid — proof-of-payment file **required** |
| `PATCH` | `/contributions/:id/confirm` | Organizer | Confirm payment |
| `PATCH` | `/contributions/:id/reject` | Organizer | Reject + reason |

No structural change here from v2 — the schema additions
(`@@unique([cycleId, groupMemberId])`) are enforced automatically by Prisma
throwing on duplicate creation attempts; the service layer just needs to
catch that and return a clean `400`/`409` rather than a raw Prisma error.

---

## 5. Payout — Plan vs. Execution (new split)

This is the biggest structural change from v2. What was one flat
`GET /groups/:id/payout-order` endpoint now maps to two concepts: **who's
scheduled** (the plan) and **what actually happened** (execution).

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/groups/:id/payout-order` | Member of group | The full rotation plan — who collects in which round |
| `GET` | `/groups/:id/payouts` | Member of group | Execution history — which payouts actually happened |
| `POST` | `/payout-order/:id/payouts` | Organizer | Record a payout as executed for a given plan entry |
| `PATCH` | `/payouts/:id` | Organizer | Update payout status (e.g. mark `failed`/`reversed`) |

### `GET /groups/:id/payout-order` — response shape

```json
[
  { "position": 1, "member_name": "John", "cycle_number": 1 },
  { "position": 2, "member_name": "Mary", "cycle_number": 2 },
  { "position": 3, "member_name": "David", "cycle_number": 3 }
]
```

This answers "whose turn is next" — PRD Section 7: "Payout order is visible
to all members and updates automatically once a cycle completes."

### `POST /payout-order/:id/payouts` — request body

```json
{
  "amount": 50000,
  "reference": "optional bank transfer ID",
  "proof_url": "optional"
}
```

Creates the `Payout` row (`status: completed` by default once the organizer
submits it — no separate "confirm" step needed here, since unlike member
contributions, the *organizer themselves* is the one recording it, not
claiming it).

**Why two endpoints instead of one field flip:** matches the schema
reasoning in `NOTES.md` Section 11 — "scheduled" and "executed" are
different facts, and separating them means a failed/reversed payout doesn't
corrupt the original plan record.

---

## 6. Dashboard & Reports (Organizer)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/groups/:id/dashboard` | Organizer | Paid/outstanding overview |
| `GET` | `/groups/:id/reports/:cycleId` | Organizer | Cycle report (PDF/CSV) |

Unchanged from v2 — Module D scope, not touched by this round of schema
updates.

---

## 7. Back-Office — Super Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/back-office/admins` | Super Admin | Create Admin account + initial group assignments |
| `GET` | `/back-office/admins` | Super Admin | List all Admins |
| `PATCH` | `/back-office/admins/:id/deactivate` | Super Admin | Deactivate Admin |
| `PATCH` | `/back-office/admins/:id/assignments` | Super Admin | Update assigned groups |
| `GET` | `/back-office/analytics` | Super Admin | Platform-wide stats (stub only, MMP) |

Unchanged from v2.

---

## 8. Back-Office — Admin (scoped)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/back-office/disputes` | Admin | Disputes for assigned groups only (auto-filtered) |
| `PATCH` | `/back-office/disputes/:id` | Admin | Resolve/update — must own the group via assignment, or 403 |
| `GET` | `/back-office/groups` | Admin | Read-only view of assigned groups |

Unchanged from v2.

---

## 9. Error Convention Additions

| Status | New usage |
|---|---|
| `409 Conflict` | Group is full (`POST /groups/:id/join`), or a duplicate contribution/payout is attempted |
| `400 Bad Request` | `total_slots` missing/invalid on group creation |

All other error conventions (401/403 for auth, 404 for missing resources)
unchanged from existing `errorHandler.js` behavior.

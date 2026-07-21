# ThriftCircle — Schema Notes (Data Model Explained)

This document explains **why** the database looks the way it does — connecting
every model back to (1) how Ajo/Esusu actually works in the real world, and
(2) what problem it solves per the PRD. Read this before touching
`schema.prisma`, and come back to it whenever a model's purpose is unclear.

> Reference: PRD v1.0 (Section 3 — Role Model, Section 7 — User Stories),
> Backend TRD v2.0 (Section 5 — Database Schema)

---

## 1. The Real-World Mechanic, in One Paragraph

A group of people (say, 10) agree to pay a fixed amount (₦5,000) on a fixed
schedule (weekly). Every round, everyone pays in, and **one** person collects
the entire pot (₦50,000). This repeats until everyone has had exactly one
turn — that's a full rotation. ThriftCircle doesn't move the money — it
tracks who owes what, who's paid, and whose turn is next, so nothing depends
on memory, trust, or a WhatsApp thread.

Everything below is that mechanic translated into tables.

---

## 2. `User`

**Real world:** every person on the platform — whether they're ThriftCircle
staff (Super Admin, Admin) or an actual Ajo participant (Organizer, Member).

**Why one table for 4 very different roles:** the PRD (Section 3) is explicit
that these are 4 *distinct* actors with different powers, but they all share
the same core shape — a name, a phone number, a password, a status. Rather
than 4 separate tables, one `User` table with a `role` enum keeps auth simple
(one login endpoint for everyone) while `role` drives what they're allowed to
do downstream, enforced in middleware (`authorize.js`), not in the schema.

**Notable fields:**
- `phoneNumber` is the unique identifier — matches how these groups actually
  onboard people in Nigeria (phone-first, not email-first).
- `createdById` — nullable, self-referencing. Null means "signed up
  themselves" (Organizer/Member via public signup). Populated means "a Super
  Admin created this account" (Admin accounts are *never* self-registered,
  per PRD Section 3 and TRD Section 3.3).
- `status` (`active`/`deactivated`) exists specifically so a Super Admin can
  deactivate an Admin without deleting their historical records (deleting
  would break every dispute/assignment they were ever linked to).

---

## 3. `Group`

**Real world:** one specific Ajo — e.g. "Aunt Funmi's 22-member group."

**Why it exists:** this is the anchor entity. Everything else (members,
cycles, contributions, payouts, disputes) belongs to exactly one group.

**Notable fields:**
- `organizerId` — the one person who owns this group. PRD Section 3 is
  explicit: an Organizer's group data is never visible to another Organizer.
  This FK is what "ownership" means in enforcement terms.
- `contributionAmount` + `frequency` — the ₦5,000/weekly agreement. Set once
  at creation (PRD Section 7: "Create a savings group and set contribution
  amount, frequency, and payout order").
- `totalSlots` — **this is the fix for a real gap we caught in review.**
  Without it, "how many rounds does this rotation have?" would have to be
  derived from *how many members currently exist*, which breaks the moment
  someone joins or leaves mid-rotation. Storing `totalSlots` at creation
  locks in "this Ajo has 10 people, therefore 10 rounds" as a fact about the
  group's plan, independent of later membership churn.
- `payoutOrderType` (`fixed`/`rotating`) — whether turn order was
  pre-agreed (fixed) or determined some other way (rotating/balloted).
- `status` — `active` while running, `completed` once every member has
  collected their payout, `archived` if the organizer shelves it. Note:
  per PRD scope, a *new* Ajo season is a *new* `Group` row, not a re-run of
  an old one — see the "Parked Decisions" section at the bottom.

---

## 4. `GroupMember`

**Real world:** the fact that a specific person belongs to a specific group
— e.g. "Tunde is a member of Aunt Funmi's group."

**Why it's a separate table from `User`:** a user isn't inherently "a
member" — they *become* one by joining a specific group, and the same person
can belong to multiple groups (future: "multi-group membership dashboard" in
PRD's Could-Have list). This join table is where group-specific state lives
(did they actually join, or were they only invited?).

**Notable fields:**
- `joinStatus` (`invited`/`active`/`removed`) — tracks the funnel: someone
  gets invited, joins (auto-join on signup per the Member flow, or explicit
  join for an already-registered user), or is later removed.
- `@@unique([groupId, userId])` — a person can't accidentally end up with
  two membership rows in the same group.

---

## 5. `Invite`

**Real world:** the link/code an organizer shares — "join my group via
thriftcircle.app/join/:code" — including the WhatsApp-native flow where
someone shares a code, not just an in-app button.

**Why it's explicit (TRD v2 called this out specifically):** the Member
registration flow *depends* on resolving an invite code to a group **before**
the person even has an account (`GET /invites/:code` is public, so the
signup form can be pre-filled with group context — PRD Section 7: "Signup
form is pre-filled with group context").

**Notable fields:**
- `code` — the shareable identifier.
- `invitedPhoneNumber` — nullable, set only if the organizer invited a
  specific number rather than sharing an open link.
- `status` (`pending`/`used`/`expired`) — prevents a code being reused
  indefinitely; expiry duration is one of the TRD's still-open decisions
  (recommend 7 days).

---

## 6. `AdminGroupAssignment`

**Real world:** ThriftCircle's own internal ops — "Admin Chidi is
responsible for monitoring these 12 groups."

**Why this table is the single most important authorization mechanism in
the whole system (TRD v2, Section 2):** the PRD's role model draws a hard
line — an Admin's access is **not** "everything except Super Admin
powers," it's an **explicit allow-list**. Without this join table, there'd
be no way to represent "Admin X can see Group A and B, but not Group C" —
you'd be stuck with a blanket boolean, which doesn't match how the product
is supposed to work at all.

**Notable fields:**
- `adminId` / `groupId` — the actual assignment.
- `assignedById` — which Super Admin made the assignment (accountability —
  if scoping is ever wrong, you can trace who set it).
- `@@unique([adminId, groupId])` — can't assign the same admin to the same
  group twice.

This is the table `scopeToAssignedGroups.js` middleware (TRD v2 Section 7.2)
queries on every single back-office request an Admin makes.

---

## 7. `ContributionCycle`

**Real world:** one **round** of the rotation — i.e., one week in your
10-person example. *Careful:* "cycle" here means one round, not the full
10-week rotation — a naming quirk inherited from the TRD, worth remembering
so it doesn't trip anyone up mid-conversation.

**Why it exists separately from `Contribution`:** a cycle is the container
for "everyone's payment obligation this round" — it's what ties together
*all 10 people's* ₦5,000 contributions *and* the one payout that round
produces. Without this grouping, there'd be no clean way to ask "did
everyone pay for round 4?" or "who got the round 4 payout?"

**Notable fields:**
- `cycleNumber` — round 1, round 2, ... round 10.
- `@@unique([groupId, cycleNumber])` — a group can't have two "round 3"s.
- `status` (`active`/`completed`) — flips once the round's payout has gone
  out and all contributions are settled.

---

## 8. `Contribution`

**Real world:** one specific person's ₦5,000 payment for one specific round
— e.g. "Tunde's payment for round 4."

**Why the status enum has 5 states, not just paid/unpaid:** this is the
core of the trust problem the PRD identifies (Section 2 — "members
frequently dispute payment history with no neutral record"). The lifecycle
mirrors reality:
`pending` (not yet due-acted-on) → `pending_confirmation` (member says
they paid, uploaded proof) → `confirmed` (organizer verified it) *or*
`rejected` (organizer disputes it, with a reason) → `overdue` (due date
passed, nothing submitted).

**Notable fields:**
- `proofOfPaymentUrl` — **required at the validation layer**, not
  optional, per TRD v2's explicit change log: "Proof-of-payment is now
  required, not optional." This directly answers the "absconding
  collector" / disputed-payment risk both organizer *and* member interviews
  surfaced (PRD Section 4a).
- `confirmedById` / `confirmedAt` — who (which organizer) verified it, and
  when — accountability, same reasoning as `assignedById` above.
- `@@unique([cycleId, groupMemberId])` — a person can only have one
  contribution row per round. Without this, nothing stops a duplicate
  ₦5,000 entry for the same person, same week.

---

## 9. `ContributionStatusLog`

**Real world:** the audit trail — "who confirmed this payment, and when did
it flip from pending to confirmed."

**Why it's a separate table instead of a JSON column on `Contribution`:**
TRD v2 recommends this explicitly for a good reason — it's *queryable*. You
can ask "show me every rejection in the last month" or "how many
contributions were confirmed by this specific organizer" without parsing
JSON blobs. This directly satisfies PRD Section 8's non-functional
requirement: "every payment status change is logged with timestamp and
actor."

**Notable fields:**
- `oldStatus` — nullable, because the very first log entry for a
  contribution has no prior state.
- `actedById` — nullable, because a status change to `overdue` might be
  triggered by a scheduled job (Redis/cron), not a human.

---

## 10. `PayoutOrder`

**Real world:** the plan — "position 4 in the rotation is Mary; she
collects the pot in round 4." Purely the schedule, not whether it happened.

**Why it's separate from `Payout` (see below):** this was a genuine gap we
caught in review — "scheduled to receive" and "actually received" are two
different facts in any real financial system, and conflating them (a single
boolean like `hasReceivedPayout`) makes it impossible to later track
*how* a payout happened, who confirmed it, or if it failed/reversed.

**Notable fields:**
- `position` — this person's turn number in the rotation.
- `@@unique([cycleId])` — exactly one designated recipient per round.
- `@@unique([groupMemberId])` — each member gets exactly **one** turn across
  the whole rotation, full stop. (This single constraint, combined with the
  one above, makes duplicate/colliding positions structurally impossible —
  no extra constraint on `position` itself needed.)

---

## 11. `Payout`

**Real world:** the actual event — "Aunt Funmi transferred ₦50,000 to Mary
on [date], reference #XYZ." The execution of the plan `PayoutOrder` describes.

**Why it exists (this was the most significant gap from review):** without
it, there's no record of a payout actually happening — only that it was
*scheduled* to. In finance, "planned" and "executed" are always tracked
separately, because execution can fail, get delayed, or get reversed in
ways the plan never anticipates.

**Notable fields:**
- `payoutOrderId` — one-to-one with the plan row (`@unique`).
- `status` (`pending`/`completed`/`failed`/`reversed`) — mirrors the
  richness `Contribution` already has, instead of a single boolean.
- `paidById` — which organizer marked it as paid (accountability, same
  pattern as `confirmedById` on `Contribution`).
- `reference` / `proofUrl` — optional fields for a bank transfer ID or
  proof screenshot, for organizers who want that level of record-keeping.
  Not required by the PRD (only *contribution* proof is mandatory — money
  custody stays outside the platform per PRD's explicit MVP scope note),
  but available.

---

## 12. `Dispute`

**Real world:** "Tunde says he paid but the organizer rejected it — this
gets escalated." Or the "absconding collector" risk — a member refuses to
pay after already collecting their payout.

**Why it exists:** PRD Section 4a validates this directly from member
interviews as a high-stakes trust risk, and Section 7 gives Admin a
specific user story: "view flagged disputes across groups... my access
stays scoped to my responsibility."

**Notable fields:**
- `groupId` — which group the dispute belongs to (this is what
  `scopeToAssignedGroups` middleware filters on for Admin access).
- `raisedById` / `involvedMemberId` — who raised it, and who it's about
  (nullable — not every dispute names a specific member).
- `status` (`open`/`resolved`).

---

## 13. `Notification`

**Real world:** "your contribution is due in 2 days" / "your payment was
rejected — here's why."

**Why it's generic (`type` enum) rather than separate tables per
notification kind:** all notifications share the same shape (a user, a
message, read/unread) — the `type` just tells the client how to render/
route it. Matches PRD Section 7's reminder requirement directly ("Reminder
sent 2 days before due date and again if overdue").

---

## 14. How It All Connects — One Full Round, Start to Finish

1. Organizer creates a `Group` (10 slots, ₦5,000/week).
2. 10 `GroupMember` rows exist (via `Invite` → signup → auto-join).
3. A `PayoutOrder` row is created for each member, assigning their turn
   (position 1–10), each linked to a specific `ContributionCycle`.
4. Round 1 begins: a `ContributionCycle` (cycleNumber = 1) exists, with 10
   `Contribution` rows (one per member), each `pending`.
5. Each member marks theirs `pending_confirmation` with proof; organizer
   confirms → `confirmed`. Every transition writes a
   `ContributionStatusLog` row.
6. Once all 10 are confirmed, the organizer pays out to whoever's
   `PayoutOrder` position is 1 for that cycle — a `Payout` row is created,
   `status: completed`.
7. Repeat for rounds 2–10. At round 10, every member has paid ₦50,000 total
   and collected ₦50,000 once — matching the real-world mechanic exactly.

---

## Parked Decisions (Not in MVP, Noted for Later)

- **Group as a long-lived container of multiple rotations** ("seasons"):
  right now, a finished Ajo (`Group.status = completed`) doesn't
  automatically become a new rotation with the same members — a new season
  means a new `Group`. Revisit if the product needs to support the same
  group of people running Ajo after Ajo without recreating membership each
  time.
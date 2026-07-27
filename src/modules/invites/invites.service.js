import {
  createInviteRecord,
  findInviteByCode,
  markInviteUsed,
  updateInviteStatus,
  findActivePendingInvitesForGroup,
} from "./invites.model.js";
import { findGroupById, countActiveMembers } from "../groups/groups.model.js";

const INVITE_EXPIRY_DAYS = 7;

export async function createInvite(groupId, requestingUserId, data) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };
  if (group.organizerId !== requestingUserId) return { forbidden: true };

  const days = data.expires_in_days ?? INVITE_EXPIRY_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const code = generateInviteCode();

  const invite = await createInviteRecord({
    code,
    groupId,
    createdById: requestingUserId,
    invitedPhoneNumber: data.invited_phone_number ?? null,
    expiresAt,
  });

  return {
    code: invite.code,
    invited_phone_number: invite.invitedPhoneNumber,
    status: invite.status,
    expires_at: invite.expiresAt,
  };
}

// PROPOSAL: expires all currently-pending codes for this group before
// issuing a new one (assumes "one live code at a time"). Flag for review.
export async function regenerateInvite(groupId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };
  if (group.organizerId !== requestingUserId) return { forbidden: true };

  const activeInvites = await findActivePendingInvitesForGroup(groupId);
  await Promise.all(
    activeInvites.map((inv) => updateInviteStatus(inv.id, "expired"))
  );

  return createInvite(groupId, requestingUserId, {});
}

// PROPOSAL: reuses "expired" status for manual disable (no distinct
// "disabled" value exists in the schema). Flag for review.
export async function disableInvite(groupId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };
  if (group.organizerId !== requestingUserId) return { forbidden: true };

  const activeInvites = await findActivePendingInvitesForGroup(groupId);
  if (activeInvites.length === 0) return { noneActive: true };

  await Promise.all(
    activeInvites.map((inv) => updateInviteStatus(inv.id, "expired"))
  );

  return { disabled: true };
}

export async function resolveInvite(code) {
  const invite = await findInviteByCode(code);

  if (!invite) return { valid: false, reason: "invalid" };
  if (invite.status === "used") return { valid: false, reason: "already_used" };
  if (invite.status === "expired" || invite.expiresAt < new Date()) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, groupId: invite.groupId, invite };
}

export async function getInvitePreview(code) {
  const result = await resolveInvite(code);
  if (!result.valid) return result;

  const group = await findGroupById(result.groupId);
  const slotsFilled = await countActiveMembers(result.groupId);

  return {
    valid: true,
    group_name: group.name,
    organizer_name: result.invite.group.organizer.fullName,
    contribution_amount: group.contributionAmount,
    frequency: group.frequency,
    total_slots: group.totalSlots,
    slots_filled: slotsFilled,
    slots_available: group.totalSlots - slotsFilled,
    invite_status: result.invite.status,
  };
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10);
}

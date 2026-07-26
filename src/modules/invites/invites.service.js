
import {
  createInviteRecord,
  findInviteByCode,
  markInviteUsed,
} from "./invites.model.js";
import { findGroupById, countActiveMembers } from "../groups/groups.model.js";

const INVITE_EXPIRY_DAYS = 7;

export async function createInvite(groupId, createdById, data) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const code = generateInviteCode();

  const invite = await createInviteRecord({
    code,
    groupId,
    createdById,
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

export async function resolveInvite(code) {
  const invite = await findInviteByCode(code);

  if (!invite) {
    return { valid: false, reason: "invalid" };
  }

  if (invite.status === "used") {
    return { valid: false, reason: "already_used" };
  }

  if (invite.status === "expired" || invite.expiresAt < new Date()) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, groupId: invite.groupId, invite };
}

export async function getInvitePreview(code) {
  const result = await resolveInvite(code);

  if (!result.valid) {
    return result;
  }

  const group = await findGroupById(result.groupId);
  const slotsFilled = await countActiveMembers(result.groupId);

  return {
    valid: true,
    group_name: group.name,
    organizer_name: invite_organizer_name(result.invite),
    contribution_amount: group.contributionAmount,
    frequency: group.frequency,
    total_slots: group.totalSlots,
    slots_filled: slotsFilled,
    slots_available: group.totalSlots - slotsFilled,
    invite_status: result.invite.status,
  };
}

function invite_organizer_name(invite) {
  return invite.group.organizer.fullName;
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10);
}

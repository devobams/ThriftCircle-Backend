import {
  createInviteRecord,
  findInviteByCode,
  markInviteUsed,
  updateInviteStatus,
  findActivePendingInvitesForGroup,
} from "./invites.model.js";
import { findGroupById, countActiveMembers } from "../groups/groups.model.js";
import prisma from "../../config/prisma.js";

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
export async function regenerateInvite(groupId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };
  if (group.organizerId !== requestingUserId) return { forbidden: true };

  const activeInvites = await findActivePendingInvitesForGroup(groupId);
  await prisma.$transaction(
    activeInvites.map((inv) =>
      prisma.invite.update({ where: { id: inv.id }, data: { status: "expired" } })
    )
  );

  return createInvite(groupId, requestingUserId, {});
}
export async function disableInvite(groupId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };
  if (group.organizerId !== requestingUserId) return { forbidden: true };

  const activeInvites = await findActivePendingInvitesForGroup(groupId);
  if (activeInvites.length === 0) return { noneActive: true };

  await prisma.$transaction(
    activeInvites.map((inv) =>
      prisma.invite.update({ where: { id: inv.id }, data: { status: "expired" } })
    )
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

import {
  createGroupWithOrganizer,
  findGroupById,
  findMembership,
  countActiveMembers,
  findGroupsByOrganizer,
  findGroupMembersList,
} from "./groups.model.js";

import { getAssignedGroups } from "../back-office/backOffice.model.js";

import { stripPasswordHash } from "../../utils/sanitizeUser.js";

export async function createGroup(organizerId, data) {
  const group = await createGroupWithOrganizer(organizerId, data);

  return {
    id: group.id,
    name: group.name,
    contribution_amount: group.contributionAmount,
    total_slots: group.totalSlots,
    frequency: group.frequency,
    payout_order_type: group.payoutOrderType,
    start_date: group.startDate,
    status: group.status,
    organizer_position: 1,
    slots_filled: 1,
    slots_available: group.totalSlots - 1,
  };
}

export async function getGroupById(groupId, userId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };

  const isOwner = group.organizerId === userId;
  const membership = await findMembership(groupId, userId);
  const isActiveMember = membership?.joinStatus === "active";

  if (!isOwner && !isActiveMember) {
    return { forbidden: true };
  }

  const slotsFilled = await countActiveMembers(groupId);

  return {
    id: group.id,
    name: group.name,
    contribution_amount: group.contributionAmount,
    frequency: group.frequency,
    payout_order_type: group.payoutOrderType,
    status: group.status,
    total_slots: group.totalSlots,
    slots_filled: slotsFilled,
    slots_available: group.totalSlots - slotsFilled,
  };
}

export async function listMyGroups(organizerId) {
  const groups = await findGroupsByOrganizer(organizerId);
  return Promise.all(
    groups.map(async (group) => {
      const slotsFilled = await countActiveMembers(group.id);
      return {
        id: group.id,
        name: group.name,
        contribution_amount: group.contributionAmount,
        frequency: group.frequency,
        status: group.status,
        total_slots: group.totalSlots,
        slots_filled: slotsFilled,
        slots_available: group.totalSlots - slotsFilled,
      };
    })
  );
}

export async function listGroupMembers(groupId, requestingUserId, role) {
  const group = await findGroupById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    throw err;
  }

  const isOrganizer = group.organizerId === requestingUserId;

  if (!isOrganizer) {
    if (role === "admin") {
      const assignments = await getAssignedGroups(requestingUserId);
      const assignedGroupIds = assignments.map((a) => a.groupId);
      if (!assignedGroupIds.includes(groupId)) {
        const err = new Error("This group is not assigned to you");
        err.status = 403;
        throw err;
      }
    } else if (role !== "super_admin") {
      const err = new Error("Not authorized to view this group's members");
      err.status = 403;
      throw err;
    }
  }

  const members = await findGroupMembersList(groupId);
  const mapped = members.map((m) => ({
    user_id: m.user.id,
    full_name: m.user.fullName,
    phone_number: m.user.phoneNumber,
    position: m.position,
    is_organizer: m.userId === group.organizerId,
    joined_at: m.joinedAt,
  }));

  return stripPasswordHash(mapped);
}
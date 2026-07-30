import {
  createGroupWithOrganizer,
  findGroupById,
  findMembership,
  countActiveMembers,
} from "./groups.model.js";

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



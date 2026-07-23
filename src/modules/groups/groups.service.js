
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createGroup(organizerId, data) {
  const group = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.group.create({
      data: {
        name: data.name,
        organizerId,
        contributionAmount: data.contribution_amount,
        totalSlots: data.total_slots,
        frequency: data.frequency,
        payoutOrderType: data.payout_order_type,
      },
    });

    // Organizer counts as the first member so they can view their own group
    await tx.groupMember.create({
      data: {
        groupId: newGroup.id,
        userId: organizerId,
        joinStatus: "active",
      },
    });

    return newGroup;
  });

  return group;
}

export async function getGroupById(groupId, userId) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return { notFound: true };
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (!membership || membership.joinStatus !== "active") {
    return { forbidden: true };
  }

  const slotsFilled = await prisma.groupMember.count({
    where: { groupId, joinStatus: "active" },
  });

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

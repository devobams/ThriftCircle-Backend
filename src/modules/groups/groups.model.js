import prisma from "../../config/prisma.js";

export function createGroupWithOrganizer(organizerId, data) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: data.name,
        organizerId,
        contributionAmount: data.contribution_amount,
        totalSlots: data.total_slots,
        frequency: data.frequency,
        payoutOrderType: data.payout_order_type,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userId: organizerId,
        position: 1,
        joinStatus: "active",
      },
    });

    return group;
  });
}

export function findGroupById(groupId) {
  return prisma.group.findUnique({ where: { id: groupId } });
}

export function findMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function countActiveMembers(groupId) {
  return prisma.groupMember.count({
    where: { groupId, joinStatus: "active" },
  });
}

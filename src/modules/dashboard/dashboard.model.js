import prisma from "../../config/prisma.js";

/**
 * Finds a group together with its current active contribution cycle.
 */
export function findGroupDashboard(groupId) {
  return prisma.group.findUnique({
    where: { id: groupId },
  });
}

/**
 * Returns the next payout for a group.
 */
export function findNextPayout(groupId) {
  return prisma.payoutOrder.findFirst({
    where: {
      cycle: {
        groupId,
      },
      payout: null,
    },
    orderBy: {
      cycle: {
        cycleNumber: "asc",
      },
    },
    
    include: {
      cycle: true,
      groupMember: {
        include: {
          user: true,
        },
      },
    },
  });
}

export function findMemberDashboardData(groupId, userId) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      groupMembers: { where: { userId } },
    },
  });
}

export function countActiveGroupMembers(groupId) {
  return prisma.groupMember.count({
    where: { groupId, joinStatus: "active" },
  });
}

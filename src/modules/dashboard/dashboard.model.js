import prisma from "../../config/prisma.js";

/**
 * Finds a group together with its current active contribution cycle.
 */
export function findGroupDashboard(groupId) {
  return prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      contributionCycles: {
        where: {
          status: "active",
        },
        orderBy: {
          cycleNumber: "desc",
        },
        take: 1,
        include: {
          contributions: {
            include: {
              groupMember: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
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
      groupMembers: {
        where: { userId },
      },
      contributionCycles: {
        where: { status: "active" },
        orderBy: { cycleNumber: "asc" },
        take: 1,
        include: {
          contributions: true,
        },
      },
    },
  });
}

export function countActiveGroupMembers(groupId) {
  return prisma.groupMember.count({
    where: { groupId, joinStatus: "active" },
  });
}

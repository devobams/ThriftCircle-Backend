import prisma from "../../config/prisma.js";

/**
 * Finds a contribution by its ID.
 */
export function findContributionById(id) {
  return prisma.contribution.findUnique({
    where: { id },
    include: {
      cycle: {
        include: {
          group: true,
        },
      },
      groupMember: {
        include: {
          user: true,
          group: { include: { organizer: true } },
        },
      },
      confirmedBy: true,
    },
  });
}

/**
 * Updates a contribution.
 */

export function updateContribution(id, data) {
  return prisma.contribution.update({
    where: { id },
    data,
  });
}

/**
 * Creates a contribution status log entry.
 */

export function createContributionStatusLog(data) {
  return prisma.contributionStatusLog.create({
    data,
  });
}

/**
 * Returns a group's contribution schedule with cycles and members.
 */

export function findGroupSchedule(groupId) {
  return prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      contributionCycles: {
        orderBy: {
          cycleNumber: "desc",
        },
        include: {
          contributions: {
            orderBy: {
              dueDate: "asc",
            },
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
 * Find Group Membership for a User
 */
export function findGroupMembershipForUser(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

/**
 * Finds a contribution together with its status history.
 */
export function findContributionWithStatusLog(id) {
  return prisma.contribution.findUnique({
    where: {
      id,
    },
    include: {
      cycle: true,
      groupMember: {
        include: {
          user: true,
          group: true,
        },
      },
      confirmedBy: true,
      statusLog: {
        orderBy: {
          actedAt: "desc",
        },
      },
    },
  });
}

/**
 * Finds a contribution with all related entities.
 */
export function findContributionByIdWithRelations(id) {
  return prisma.contribution.findUnique({
    where: {
      id,
    },
    include: {
      cycle: {
        include: {
          group: true,
        },
      },
      groupMember: {
        include: {
          user: true,
          group: true,
        },
      },
      confirmedBy: true,
      statusLog: {
        orderBy: {
          actedAt: "desc",
        },
      },
    },
  });
}

export function applyStatusTransition(contributionId, updateData, logData) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.contribution.update({
      where: { id: contributionId },
      data: updateData,
    });
    await tx.contributionStatusLog.create({
      data: { ...logData, contributionId },
    });
    return updated;
  });
}

export function findGroupForRotationStart(groupId) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      groupMembers: {
        where: { joinStatus: "active" },
        orderBy: { position: "asc" },
      },
      contributionCycles: true,
    },
  });
}

export function createRotationSchedule(groupId, cyclesData) {
  return prisma.$transaction(async (tx) => {
    const createdCycles = [];
    for (const c of cyclesData) {
      const cycle = await tx.contributionCycle.create({
        data: { groupId, cycleNumber: c.cycleNumber, status: "active" },
      });

      await tx.contribution.createMany({
        data: c.contributions.map((member) => ({
          cycleId: cycle.id,
          groupMemberId: member.groupMemberId,
          dueDate: c.dueDate,
          amount: member.amount,
          status: "pending",
        })),
      });

      await tx.payoutOrder.create({
        data: { cycleId: cycle.id, groupMemberId: c.recipientGroupMemberId },
      });

      createdCycles.push(cycle);
    }
    return createdCycles;
  });
}

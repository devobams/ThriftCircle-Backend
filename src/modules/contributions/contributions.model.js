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
          group: true,
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
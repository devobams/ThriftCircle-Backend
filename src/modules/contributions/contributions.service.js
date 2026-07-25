import { prisma } from "../../config/prisma.js";

export async function getContributionSchedule(groupId) {
  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      contributionCycles: {
        where: {
          status: "active",
        },
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

  if (!group) {
    return {
        message: "Group not found"
    }
  }

  const currentCycle = group.contributionCycles[0];

  return {
    group: {
      id: group.id,
      name: group.name,
      contributionAmount: group.contributionAmount,
      frequency: group.frequency,
    },

    currentCycle: currentCycle
      ? {
          cycleNumber: currentCycle.cycleNumber,
          status: currentCycle.status,
        }
      : null,

    members:
      currentCycle?.contributions.map((contribution) => ({
        memberId: contribution.groupMember.user.id,
        fullName: contribution.groupMember.user.fullName,
        status: contribution.status,
        amount: contribution.amount,
        dueDate: contribution.dueDate,
      })) ?? [],
  };
}
import prisma from "../../config/prisma.js";

export async function findContributionReport(groupId, cycleId) {
  return prisma.contributionCycle.findFirst({
    where: {
      id: cycleId,
      groupId,
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          contributionAmount: true,
          frequency: true,
        },
      },
      contributions: {
        include: {
          groupMember: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      },
      payoutOrder: {
        include: {
          groupMember: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
          payout: true,
        },
      },
    },
  });
}
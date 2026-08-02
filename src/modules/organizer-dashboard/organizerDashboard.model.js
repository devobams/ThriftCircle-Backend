import prisma from "../../config/prisma.js";

export function countOrganizerGroups(organizerId) {
  return prisma.group.count({ where: { organizerId } });
}

export function countOrganizerPendingPayments(organizerId) {
  return prisma.contribution.count({
    where: {
      status: { in: ["pending", "pending_confirmation"] },
      groupMember: { group: { organizerId } },
    },
  });
}

export function sumOrganizerConfirmedContributions(organizerId) {
  return prisma.contribution.aggregate({
    where: {
      status: "confirmed",
      groupMember: { group: { organizerId } },
    },
    _sum: { amount: true },
  });
}

export function countOrganizerCompletedCycles(organizerId) {
  return prisma.contributionCycle.count({
    where: {
      status: "completed",
      group: { organizerId },
    },
  });
}

export function findOrganizerUpcomingPayout(organizerId) {
  return prisma.payoutOrder.findFirst({
    where: {
      payout: null,
      cycle: { group: { organizerId } },
    },
    orderBy: { cycle: { cycleNumber: "asc" } },
    include: {
      cycle: {
        include: {
          group: true,
          contributions: {
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
      },
    },
  });
}
// payouts.model.js
import prisma from "../../config/prisma.js";

export function findPayoutOrdersByGroup(groupId) {
  return prisma.payoutOrder.findMany({
    where: { cycle: { groupId } },
    orderBy: { cycle: { cycleNumber: "asc" } },
    include: { cycle: true, groupMember: { include: { user: true } }, payout: true },
  });
}

export function findPayoutOrderById(id) {
  return prisma.payoutOrder.findUnique({
    where: { id },
    include: {
      cycle: { include: { group: true, contributions: true } },
      groupMember: { include: { user: true } },
      payout: true,
    },
  });
}

export function findPayoutsByGroup(groupId) {
  return prisma.payout.findMany({
    where: { payoutOrder: { cycle: { groupId } } },
    orderBy: { createdAt: "desc" },
    include: { payoutOrder: { include: { groupMember: { include: { user: true } }, cycle: true } }, paidBy: true },
  });
}

export function findPayoutById(id) {
  return prisma.payout.findUnique({
    where: { id },
    include: { payoutOrder: { include: { cycle: { include: { group: true } } } } },
  });
}

export function updatePayout(id, data) {
  return prisma.payout.update({ where: { id }, data });
}
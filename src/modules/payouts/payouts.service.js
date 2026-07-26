// payouts.service.js
import prisma from "../../config/prisma.js";
import {
  findPayoutOrdersByGroup,
  findPayoutOrderById,
  findPayoutsByGroup,
  findPayoutById,
  updatePayout,
} from "./payouts.model.js";

// getPayoutOrder
export async function getPayoutOrder(groupId) {
  return findPayoutOrdersByGroup(groupId);
}

// getPayoutHistory
export async function getPayoutHistory(groupId) {
  return findPayoutsByGroup(groupId);
}

// recordPayout
export async function recordPayout(payoutOrderId, organizerId, { reference, proofUrl }) {
  const payoutOrder = await findPayoutOrderById(payoutOrderId);
  if (!payoutOrder) {
    const err = new Error("Payout order not found");
    err.status = 404;
    throw err;
  }

  // check if payout order belongs to organizer
  if (payoutOrder.cycle.group.organizerId !== organizerId) {
    const err = new Error("You are not the organizer of this group");
    err.status = 403;
    throw err;
  }
  // check if payout order has already been recorded
  if (payoutOrder.payout) {
    const err = new Error("A payout has already been recorded for this slot");
    err.status = 409;
    throw err;
  }

  // The pot must be fully collected before it can be paid out —
  // matches real practice confirmed by organizer interview.
  const unconfirmed = payoutOrder.cycle.contributions.filter((c) => c.status !== "confirmed");
  if (unconfirmed.length > 0) {
    const err = new Error(`Cannot record payout — ${unconfirmed.length} contribution(s) not yet confirmed`);
    err.status = 409;
    throw err;
  }

  // The pot must be fully collected before it can be paid out
  const totalPot = payoutOrder.cycle.contributions.reduce((sum, c) => sum + Number(c.amount), 0);

  // record payout
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.create({
      data: {
        payoutOrderId,
        amount: totalPot,
        status: "completed",
        paidById: organizerId,
        paidAt: new Date(),
        reference,
        proofUrl,
      },
    });
    await tx.contributionCycle.update({
      where: { id: payoutOrder.cycleId },
      data: { status: "completed", completedAt: new Date() },
    });
    return payout;
  });
}

// updatePayoutStatus
export async function updatePayoutStatus(payoutId, organizerId, status) {
  const payout = await findPayoutById(payoutId);
  if (!payout) {
    const err = new Error("Payout not found");
    err.status = 404;
    throw err;
  }
  if (payout.payoutOrder.cycle.group.organizerId !== organizerId) {
    const err = new Error("You are not the organizer of this group");
    err.status = 403;
    throw err;
  }
  return updatePayout(payoutId, { status });
}
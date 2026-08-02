import {
  countOrganizerGroups,
  countOrganizerPendingPayments,
  sumOrganizerConfirmedContributions,
  countOrganizerCompletedCycles,
  findOrganizerUpcomingPayout,
} from "./organizerDashboard.model.js";

export async function getOrganizerDashboard(organizerId) {
  const [
    totalGroups,
    pendingPayments,
    collectionSum,
    completedCycles,
    upcomingPayout,
  ] = await Promise.all([
    countOrganizerGroups(organizerId),
    countOrganizerPendingPayments(organizerId),
    sumOrganizerConfirmedContributions(organizerId),
    countOrganizerCompletedCycles(organizerId),
    findOrganizerUpcomingPayout(organizerId),
  ]);

  return {
    pending_payments: pendingPayments,
    total_collection: Number(collectionSum._sum.amount ?? 0),
    total_groups: totalGroups,
    completed_cycles: completedCycles,
    upcoming_payment: upcomingPayout
      ? {
          group_name: upcomingPayout.cycle.group.name,
          next_payout_date:
            upcomingPayout.cycle.contributions[0]?.dueDate ?? null,
        }
      : null,
  };
}

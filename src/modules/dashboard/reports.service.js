import { findContributionReport } from "./reports.model.js";
import { findGroupById } from "../groups/groups.model.js";

export async function getContributionReport(groupId, cycleId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) {
    return { message: "Group not found." };
  }
  if (group.organizerId !== requestingUserId) {
    const err = new Error("You are not the organizer of this group.");
    err.status = 403;
    throw err;
  }

  const report = await findContributionReport(groupId, cycleId);
  if (!report) {
    return { message: "Contribution cycle not found." };
  }

  const totalExpected = report.contributions.reduce(
    (sum, contribution) => sum + Number(contribution.amount),
    0
  );

  const totalConfirmed = report.contributions
    .filter((contribution) => contribution.status === "confirmed")
    .reduce((sum, contribution) => sum + Number(contribution.amount), 0);

  const totalPending = report.contributions
    .filter((contribution) => contribution.status === "pending")
    .reduce((sum, contribution) => sum + Number(contribution.amount), 0);

  return {
    group: report.group,

    cycle: {
      id: report.id,
      cycleNumber: report.cycleNumber,
      status: report.status,
      startedAt: report.startedAt,
      completedAt: report.completedAt,
    },

    summary: {
      totalExpected,
      totalConfirmed,
      totalPending,
      totalMembers: report.contributions.length,
    },

    payout: report.payoutOrder
      ? {
          beneficiary: report.payoutOrder.groupMember.user.fullName,
          status: report.payoutOrder.payout?.status ?? "pending",
          amount: report.payoutOrder.payout?.amount ?? null,
          paidAt: report.payoutOrder.payout?.paidAt ?? null,
        }
      : null,

    contributions: report.contributions.map((contribution) => ({
      contributionId: contribution.id,
      memberId: contribution.groupMember.user.id,
      fullName: contribution.groupMember.user.fullName,
      phoneNumber: contribution.groupMember.user.phoneNumber,
      amount: contribution.amount,
      dueDate: contribution.dueDate,
      status: contribution.status,
      confirmedAt: contribution.confirmedAt,
    })),
  };
}
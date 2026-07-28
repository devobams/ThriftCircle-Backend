import {
  findGroupDashboard,
  findNextPayout,
} from "./dashboard.model.js";

export async function getGroupDashboard(groupId) {
  const group = await findGroupDashboard(groupId);

  if (!group) {
    throw new Error("Group not found.");
  }

  const currentCycle = group.contributionCycles[0];

  const contributions = currentCycle?.contributions ?? [];

  const totalExpected = contributions.reduce(
    (total, contribution) => total + Number(contribution.amount),
    0
  );

  const totalConfirmed = contributions
    .filter((contribution) => contribution.status === "confirmed")
    .reduce(
      (total, contribution) => total + Number(contribution.amount),
      0
    );

  const members = contributions.map((contribution) => ({
    memberId: contribution.groupMember.user.id,
    name: contribution.groupMember.user.fullName,
    status: contribution.status,
    amount: Number(contribution.amount),
    overdue:
      contribution.status === "overdue" ||
      (contribution.status === "pending" &&
        new Date(contribution.dueDate) < new Date()),
    dueDate: contribution.dueDate,
  }));

  const nextPayout = await findNextPayout(groupId);

  return {
    group: {
      id: group.id,
      name: group.name,
      contributionAmount: Number(group.contributionAmount),
      frequency: group.frequency,
    },

    current_cycle: currentCycle?.cycleNumber ?? null,

    total_expected: totalExpected,

    total_confirmed: totalConfirmed,

    members,

    next_payout: nextPayout
      ? {
          member_name: nextPayout.groupMember.user.fullName,
          cycle_number: nextPayout.cycle.cycleNumber,
        }
      : null,
  };
}
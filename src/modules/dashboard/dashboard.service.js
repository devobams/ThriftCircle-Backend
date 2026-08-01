import {
  findGroupDashboard,
  findNextPayout,
  findMemberDashboardData,
  countActiveGroupMembers,
} from "./dashboard.model.js";

import { getCurrentCycle } from "../contributions/contributions.service.js";


export async function getGroupDashboard(groupId, requestingUserId) {
  const group = await findGroupDashboard(groupId);
  if (!group) {
    const err = new Error("Group not found.");
    err.status = 404;
    throw err;
  }
  if (group.organizerId !== requestingUserId) {
    const err = new Error("You are not the organizer of this group.");
    err.status = 403;
    throw err;
  }

  const currentCycle = await getCurrentCycle(groupId);
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

export async function getMemberDashboard(groupId, requestingUserId) {
  const group = await findMemberDashboardData(groupId, requestingUserId);
  if (!group) {
    const err = new Error("Group not found.");
    err.status = 404;
    throw err;
  }

  const membership = group.groupMembers[0];
  if (!membership || membership.joinStatus !== "active") {
    const err = new Error("You are not a member of this group.");
    err.status = 403;
    throw err;
  }

  const memberCount = await countActiveGroupMembers(groupId);
  const currentCycle = group.contributionCycles[0];
  const allContributions = currentCycle?.contributions ?? [];

  const yourContribution = allContributions.find(
    (c) => c.groupMemberId === membership.id
  );

  const confirmedCount = allContributions.filter((c) => c.status === "confirmed").length;
  const percentConfirmed = allContributions.length > 0
    ? Math.round((confirmedCount / allContributions.length) * 100)
    : 0;

  return {
    group: {
      id: group.id,
      name: group.name,
      member_count: memberCount,
    },
    your_contribution: yourContribution
      ? {
          amount: Number(yourContribution.amount),
          due_date: yourContribution.dueDate,
          status: yourContribution.status,
        }
      : null,
    your_position: membership.position,
    cycle_progress: {
      percent_confirmed: percentConfirmed,
      cycle_due_date: currentCycle?.contributions[0]?.dueDate ?? null,
    },
  };
}
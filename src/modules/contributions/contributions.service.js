import {
  findGroupSchedule,
  findContributionById,
  applyStatusTransition,
  findGroupForRotationStart,
  createRotationSchedule,
} from "./contributions.model.js";

// getContributionSchedule
export async function getContributionSchedule(groupId) {
  return findGroupSchedule(groupId);
}

// submitPayment, steps: 1: find contribution, 2: update contribution
export async function submitPayment(contributionId, userId, proofOfPaymentUrl) {
  // find contribution first in case it doesn't exist
  const contribution = await findContributionById(contributionId);
  if (!contribution) {
    const err = new Error("Contribution not found");
    err.status = 404;
    throw err;
  }

  // check if contribution belongs to user
  if (contribution.groupMember.userId !== userId) {
    const err = new Error("You can only submit payment for your own contribution");
    err.status = 403;
    throw err;
  }

  // check if contribution is pending
  if (contribution.status !== "pending") {
    const err = new Error(`Cannot submit payment — contribution is already "${contribution.status}"`);
    err.status = 409;
    throw err;
  }

  // update contribution
  return applyStatusTransition(
    contributionId,
    { status: "pending_confirmation", proofOfPaymentUrl },
    { oldStatus: "pending", newStatus: "pending_confirmation", actedById: userId }
  );
}

// confirmContribution
export async function confirmContribution(contributionId, organizerId, note) {
  // find contribution first in case it doesn't exist
  const contribution = await findContributionById(contributionId);
  if (!contribution) {
    const err = new Error("Contribution not found");
    err.status = 404;
    throw err;
  }

  // check if contribution belongs to user
  if (contribution.groupMember.group.organizerId !== organizerId) {
    const err = new Error("You are not the organizer of this group");
    err.status = 403;
    throw err;
  }

  // check if contribution is pending
  if (contribution.status !== "pending_confirmation") {
    const err = new Error(`Cannot confirm — contribution is "${contribution.status}", not awaiting confirmation`);
    err.status = 409;
    throw err;
  }

  // update contribution, with organize Id and date
  return applyStatusTransition(
    contributionId,
    { status: "confirmed", confirmedById: organizerId, confirmedAt: new Date() },
    { oldStatus: "pending_confirmation", newStatus: "confirmed", actedById: organizerId, note }
  );
}

// rejectContribution
export async function rejectContribution(contributionId, organizerId, rejectionReason, note) {
  // find contribution first in case it doesn't exist
  const contribution = await findContributionById(contributionId);
  if (!contribution) {
    const err = new Error("Contribution not found");
    err.status = 404;
    throw err;
  }

  // check if contribution belongs to user
  if (contribution.groupMember.group.organizerId !== organizerId) {
    const err = new Error("You are not the organizer of this group");
    err.status = 403;
    throw err;
  }

  // check if contribution is pending
  if (contribution.status !== "pending_confirmation") {
    const err = new Error(`Cannot reject — contribution is "${contribution.status}", not awaiting confirmation`);
    err.status = 409;
    throw err;
  }

  // update contribution with new status
  return applyStatusTransition(
    contributionId,
    { status: "rejected", rejectionReason },
    { oldStatus: "pending_confirmation", newStatus: "rejected", actedById: organizerId, note }
  );
}

function computeDueDate(startDate, frequency, cycleNumber) {
  const date = new Date(startDate);
  const offset = cycleNumber - 1;
  if (frequency === "weekly") date.setDate(date.getDate() + offset * 7);
  else date.setMonth(date.getMonth() + offset);
  return date;
}

export async function startRotation(gorupId, organizerId) {
  const group = await findGroupForRotationStart(gorupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    throw err;
  }

  if (group.organizerId !== organizerId) {
    const err = new Error("You are not the organizer of this group");
    err.status = 403;
    throw err;
  }

  if (group.contributionCycles.length > 0) {
    const err = new Error("This group's rotation has already started");
    err.status = 409;
    throw err;
  }

  if (group.groupMembers.length !== group.totalSlots) {
    const err = new Error(`Cannot start - ${group.groupMembers.length}/${group.totalSlots} slots filled`);
    err.status = 409;
    throw err;
  }

  const startDate = new Date();
  const cyclesData = [];

  for (let round = 1; round <= group.totalSlots; round++) {
    const recipient = group.groupMembers.find((m) => m.position === round);
    cyclesData.push({
      cycleNumber: round,
      dueDate: computeDueDate(startDate, group.frequency, round),
      recipientGroupMemberId: recipient.id,
      // every member contributes every round, no exemption for the recipient
      // — confirmed directly by organizer interview, see NOTES.md
      contributions: group.groupMembers.map((m) => ({
        groupMemberId: m.id,
        amount: group.contributionAmount,
      })),
    });
  }

  return createRotationSchedule(group.id, cyclesData);
}
import {
  findGroupSchedule,
  findContributionById,
  applyStatusTransition,
  findGroupForRotationStart,
  createRotationSchedule,
  findGroupMembershipForUser,
  findContributionsByCycle,
  findContributionsByUser,
} from "./contributions.model.js";
import { updateGroupStartDate } from "../groups/groups.model.js";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary.js"; // add import

import { stripPasswordHash } from "../../utils/sanitizeUser.js";


export async function getContributionSchedule(groupId, requestingUserId) {
  const membership = await findGroupMembershipForUser(groupId, requestingUserId);
  if (!membership) {
    const err = new Error("You are not a member of this group");
    err.status = 403;
    throw err;
  }
  const schedule = await findGroupSchedule(groupId);
  return stripPasswordHash(schedule);
}

// submitPayment, steps: 1: find contribution, 2: update contribution
export async function submitPayment(contributionId, userId, fileBuffer) {
  const contribution = await findContributionById(contributionId);
  if (!contribution) {
    const err = new Error("Contribution not found");
    err.status = 404;
    throw err;
  }

  if (contribution.groupMember.userId !== userId) {
    const err = new Error("You can only submit payment for your own contribution");
    err.status = 403;
    throw err;
  }

  if (contribution.status !== "pending") {
    const err = new Error(`Cannot submit payment — contribution is already "${contribution.status}"`);
    err.status = 409;
    throw err;
  }

  // Only upload once every check above has passed
  const uploadResult = await uploadToCloudinary(fileBuffer);

  return applyStatusTransition(
    contributionId,
    { status: "pending_confirmation", proofOfPaymentUrl: uploadResult.secure_url },
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

// get details and status of your contribution
export async function getContributionDetail(contributionId, requestingUserId) {
  const contribution = await findContributionById(contributionId);
  if (!contribution) {
    const err = new Error("Contribution not found");
    err.status = 404;
    throw err;
  }
  const isOwner = contribution.groupMember.userId === requestingUserId;
  const isOrganizer = contribution.groupMember.group.organizerId === requestingUserId;
  if (!isOwner && !isOrganizer) {
    const err = new Error("Not authorized to view this contribution");
    err.status = 403;
    throw err;
  }

  return stripPasswordHash({
    id: contribution.id,
    status: contribution.status,
    amount: contribution.amount,
    due_date: contribution.dueDate,
    submitted_proof_url: contribution.proofOfPaymentUrl,
    organizer_name: contribution.groupMember.group.organizer?.fullName, // confirm findContributionById includes this
    confirmed_at: contribution.confirmedAt,
    rejection_reason: contribution.rejectionReason,
  });
}

export async function getCurrentCycle(groupId) {
  const schedule = await findGroupSchedule(groupId);
  const current = schedule.contributionCycles
    .filter((c) => c.status !== "completed")
    .sort((a, b) => a.cycleNumber - b.cycleNumber)[0];
  return current ?? null;
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

export async function startRotation(groupId, organizerId, requestedStartDate) {
  const group = await findGroupForRotationStart(groupId);
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
    const err = new Error(`Cannot start — ${group.groupMembers.length}/${group.totalSlots} slots filled`);
    err.status = 409;
    throw err;
  }

  // Precedence: explicit override at start-rotation > date set at group creation > today
  const startDate = requestedStartDate ?? group.startDate ?? new Date();
  const cyclesData = [];
  for (let round = 1; round <= group.totalSlots; round++) {
    const recipient = group.groupMembers.find((m) => m.position === round);
    cyclesData.push({
      cycleNumber: round,
      dueDate: computeDueDate(startDate, group.frequency, round),
      recipientGroupMemberId: recipient.id,
      contributions: group.groupMembers.map((m) => ({
        groupMemberId: m.id,
        amount: group.contributionAmount,
      })),
    });
  }

  await updateGroupStartDate(groupId, startDate); // persist for dashboard/reports later

  return createRotationSchedule(groupId, cyclesData);
}

export async function getCycleContributions(groupId, cycleId, requestingUserId) {
  const membership = await findGroupMembershipForUser(groupId, requestingUserId);
  if (!membership) {
    const err = new Error("You are not a member of this group");
    err.status = 403;
    throw err;
  }
  const contributions = await findContributionsByCycle(cycleId);
  return stripPasswordHash(contributions);
}


export async function getMyContributions(userId) {
  const contributions = await findContributionsByUser(userId);
  return stripPasswordHash(contributions);
}
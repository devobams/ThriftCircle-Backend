import {
  findGroupById,
  findMembership,
  createDispute,
  findDisputeById,
  findDisputesByGroup,
  findContributionInGroup,
} from "./disputes.model.js";
import { stripPasswordHash } from "../../utils/sanitizeUser.js";

import { findGroupById, findMembership, createDispute, findDisputeById, findDisputesByGroup, findContributionInGroup } from "./disputes.model.js";

export async function raiseDispute(groupId, userId, data) {
  const group = await findGroupById(groupId);
  if (!group) {
    const err = new Error("Group not found");
    err.status = 404;
    throw err;
  }

  const isOrganizer = group.organizerId === userId;
  const membership = await findMembership(groupId, userId);
  const isActiveMember = membership?.joinStatus === "active";

  if (!isOrganizer && !isActiveMember) {
    const err = new Error("You are not a member of this group");
    err.status = 403;
    throw err;
  }

  if (data.involved_member_id) {
    const involvedMembership = await findMembership(groupId, data.involved_member_id);
    if (!involvedMembership) {
      const err = new Error("involved_member_id must be a member of this group");
      err.status = 400;
      throw err;
    }
  }

  if (data.contribution_id) {
    const contribution = await findContributionInGroup(data.contribution_id, groupId);
    if (!contribution) {
      const err = new Error("contribution_id must belong to this group");
      err.status = 400;
      throw err;
    }
  }

  const dispute = await createDispute({
    groupId,
    raisedById: userId,
    involvedMemberId: data.involved_member_id ?? null,
    contributionId: data.contribution_id ?? null,
    description: data.description,
    status: "open",
  });

  return dispute;
}

export async function getDisputeById(disputeId, requestingUserId) {
  const dispute = await findDisputeById(disputeId);
  if (!dispute) return { notFound: true };

  const isRaiser = dispute.raisedById === requestingUserId;
  const isOrganizer = dispute.group.organizerId === requestingUserId;

  if (!isRaiser && !isOrganizer) return { forbidden: true };

  return { dispute: stripPasswordHash(dispute) };
}

export async function listGroupDisputes(groupId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };

  if (group.organizerId !== requestingUserId) return { forbidden: true };

  const disputes = await findDisputesByGroup(groupId);
  return { disputes: stripPasswordHash(disputes) };
}
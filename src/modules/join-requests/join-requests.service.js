
import {
  findPendingRequest,
  createJoinRequestRecord,
  findPendingRequestsForGroup,
  findJoinRequestById,
  updateJoinRequestStatus,
  findApprovedRequest,
  findTakenPositions,
  createGroupMemberFromRequest,
  findGroupMembership,
} from "./join-requests.model.js";
import { resolveInvite } from "../invites/invites.service.js";
import { findGroupById } from "../groups/groups.model.js";

export async function createJoinRequest(groupId, userId, inviteCode) {
  const inviteResult = await resolveInvite(inviteCode);
  if (!inviteResult.valid) return { invalid: true, reason: inviteResult.reason };
  if (inviteResult.groupId !== groupId) return { invalid: true, reason: "code_wrong_group" };

  const existingMembership = await findGroupMembership(groupId, userId);
  if (existingMembership) return { alreadyMember: true };

  const existing = await findPendingRequest(groupId, userId);
  if (existing) return { alreadyRequested: true };

  const joinRequest = await createJoinRequestRecord(groupId, userId);
  return { created: true, joinRequest };
}

export async function getJoinRequestStatus(joinRequestId, requestingUserId) {
  const joinRequest = await findJoinRequestById(joinRequestId);
  if (!joinRequest) return { notFound: true };

  const isRequester = joinRequest.userId === requestingUserId;
  const isOrganizer = joinRequest.group.organizerId === requestingUserId;
  if (!isRequester && !isOrganizer) return { forbidden: true };

  return {
    valid: true,
    id: joinRequest.id,
    status: joinRequest.status,
    group_id: joinRequest.group.id,
    group_name: joinRequest.group.name,
    organizer_name: joinRequest.group.organizer.fullName,
    date_created: joinRequest.createdAt,
  };
}

export async function listPendingJoinRequests(groupId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };
  if (group.organizerId !== requestingUserId) return { forbidden: true };

  const requests = await findPendingRequestsForGroup(groupId);
  return {
    requests: requests.map((r) => ({
      id: r.id,
      user_id: r.userId,
      full_name: r.user.fullName,
      requested_at: r.createdAt,
    })),
  };
}

export async function approveJoinRequest(joinRequestId, requestingUserId) {
  const joinRequest = await findJoinRequestById(joinRequestId);
  if (!joinRequest) return { notFound: true };
  if (joinRequest.group.organizerId !== requestingUserId) return { forbidden: true };
  if (joinRequest.status !== "pending") return { alreadyReviewed: true };

  await updateJoinRequestStatus(joinRequestId, "approved", requestingUserId);
  return { approved: true };
}

export async function rejectJoinRequest(joinRequestId, requestingUserId) {
  const joinRequest = await findJoinRequestById(joinRequestId);
  if (!joinRequest) return { notFound: true };
  if (joinRequest.group.organizerId !== requestingUserId) return { forbidden: true };
  if (joinRequest.status !== "pending") return { alreadyReviewed: true };

  await updateJoinRequestStatus(joinRequestId, "rejected", requestingUserId);
  return { rejected: true };
}

export async function getAvailableSlots(groupId, requestingUserId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };

  const isOwner = group.organizerId === requestingUserId;
  const approved = await findApprovedRequest(groupId, requestingUserId);
  if (!isOwner && !approved) return { forbidden: true };

  const taken = await findTakenPositions(groupId);
  const takenSet = new Set(taken.map((t) => t.position));

  const available = [];
  for (let p = 2; p <= group.totalSlots; p++) {
    if (!takenSet.has(p)) available.push(p);
  }

  return { available_positions: available };
}
export async function selectPosition(joinRequestId, requestingUserId, position) {
  const joinRequest = await findJoinRequestById(joinRequestId);
  if (!joinRequest) return { notFound: true };
  if (joinRequest.userId !== requestingUserId) return { forbidden: true };
  if (joinRequest.status !== "approved") return { notApproved: true };
  if (position > joinRequest.group.totalSlots) return { invalidPosition: true };

  try {
    const member = await createGroupMemberFromRequest(joinRequest.groupId, requestingUserId, position);
    return { joined: true, position: member.position };
  } catch (err) {
    if (err.code === "P2002") {
      const target = err.meta?.target ?? [];
      if (target.includes("position")) return { positionTaken: true };
      if (target.includes("user_id")) return { alreadyMember: true };
      return { positionTaken: true };
    }
    throw err;
  }
}
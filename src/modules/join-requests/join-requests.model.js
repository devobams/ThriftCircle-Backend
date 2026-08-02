
import prisma from "../../config/prisma.js";

export function findPendingRequest(groupId, userId) {
  return prisma.joinRequest.findFirst({
    where: { groupId, userId, status: "pending" },
  });
}

export function createJoinRequestRecord(groupId, userId) {
  return prisma.joinRequest.create({
    data: { groupId, userId, status: "pending" },
  });
}

export function findPendingRequestsForGroup(groupId) {
  return prisma.joinRequest.findMany({
    where: { groupId, status: "pending" },
    include: { user: true },
  });
}

export function findJoinRequestById(joinRequestId) {
  return prisma.joinRequest.findUnique({
    where: { id: joinRequestId },
    include: { group: { include: { organizer: true } } },
  });
}

export function findGroupMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function updateJoinRequestStatus(joinRequestId, status, reviewedById) {
  return prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: { status, reviewedAt: new Date(), reviewedById },
  });
}

export function findApprovedRequest(groupId, userId) {
  return prisma.joinRequest.findFirst({
    where: { groupId, userId, status: "approved" },
  });
}

export function findTakenPositions(groupId) {
  return prisma.groupMember.findMany({
    where: { groupId },
    select: { position: true },
  });
}

export function createGroupMemberFromRequest(groupId, userId, position) {
  return prisma.$transaction(
    async (tx) => {
      return tx.groupMember.create({
        data: { groupId, userId, position, joinStatus: "active" },
      });
    },
    { isolationLevel: "Serializable" }
  );
}

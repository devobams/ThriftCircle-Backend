import prisma from "../../config/prisma.js";

export function findGroupById(groupId) {
  return prisma.group.findUnique({ where: { id: groupId } });
}

export function findMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export function createDispute(data) {
  return prisma.dispute.create({ data });
}

export function findDisputeById(id) {
  return prisma.dispute.findUnique({
    where: { id },
    include: {
      group: { include: { organizer: true } },
      raisedBy: true,
      involvedMember: true,
      contribution: true,
    },
  });
}

export function findDisputesByGroup(groupId) {
  return prisma.dispute.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    include: { raisedBy: true, involvedMember: true, contribution: true },
  });
}

export function findContributionInGroup(contributionId, groupId) {
  return prisma.contribution.findFirst({
    where: {
      id: contributionId,
      groupMember: { groupId },
    },
  });
}
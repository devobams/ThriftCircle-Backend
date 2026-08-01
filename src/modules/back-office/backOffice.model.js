import prisma from "../../config/prisma.js";

//Find admin by phone number
export function findAdminByPhoneNumber(phoneNumber) {
  return prisma.user.findUnique({ where: { phoneNumber } });
}

// Create admin
export function createAdmin(data) {
  return prisma.user.create({ data });
}

// Find admin by ID
export function findAdminById(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

//List all admins
export function findAllAdmins() {
  return prisma.user.findMany({
    where: { role: "admin" },
    orderBy: { createdAt: "desc" },
  });
}
//Deactivate admin
export function deactivateAdmin(id) {
  return prisma.user.update({
    where: { id },
    data: { status: "deactivated" },
  });
}

//Remove all current assignments
export function deleteAssignments(adminId) {
  return prisma.adminGroupAssignment.deleteMany({ where: { adminId } });
}

//Create new assignments
export function createAssignments(adminId, groupIds, assignedById) {
  return prisma.adminGroupAssignment.createMany({
    data: groupIds.map((groupId) => ({ adminId, groupId, assignedById })),
  });
}

// Assigned groups
export function getAssignedGroups(adminId) {
  return prisma.adminGroupAssignment.findMany({
    where: { adminId },
    include: { group: true },
  });
}

//Assigned disputes
export function getAssignedDisputes(groupIds) {
  return prisma.dispute.findMany({
    where: { groupId: { in: groupIds } },
    include: { group: true, raisedBy: true, involvedMember: true },
    orderBy: { createdAt: "desc" },
  });
}

//Platform analytics
export function getPlatformAnalytics() {
  return prisma.$transaction([
    prisma.user.count(),
    prisma.group.count(),
    prisma.group.count({ where: { status: "active" } }),
    prisma.dispute.count({ where: { status: "open" } }),
  ]);
}


export function updateDisputeStatusConditional(disputeId, data) {
  return prisma.dispute.updateMany({
    where: { id: disputeId, status: { in: ["open", "in_review"] } },
    data,
  });
}

export function countDisputesByStatus(groupIds) {
  const where = groupIds ? { groupId: { in: groupIds } } : {};
  return prisma.dispute.groupBy({
    by: ["status"],
    where,
    _count: true,
  });
}

export function countOverdueContributions(groupIds) {
  const where = groupIds
    ? { status: "overdue", groupMember: { groupId: { in: groupIds } } }
    : { status: "overdue" };
  return prisma.contribution.count({ where });
}

export function findGroupsWithOpenDisputes(groupIds, dateFrom, dateTo) {
  const disputeWhere = { status: "open" };
  if (dateFrom || dateTo) {
    disputeWhere.createdAt = {};
    if (dateFrom) disputeWhere.createdAt.gte = new Date(dateFrom);
    if (dateTo) disputeWhere.createdAt.lte = new Date(dateTo);
  }
  const groupWhere = groupIds ? { id: { in: groupIds } } : {};

  return prisma.group.findMany({
    where: {
      ...groupWhere,
      disputes: { some: disputeWhere },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { disputes: { where: disputeWhere } } },
    },
  });
}
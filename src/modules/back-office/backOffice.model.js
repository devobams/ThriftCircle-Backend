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

// Resolve dispute
export function resolveDispute(disputeId) {
  return prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "resolved" },
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

import prisma from "../../config/prisma.js";

//Find admin by phone number
export function findAdminByPhoneNumber(phoneNumber) {
  return prisma.user.findUnique({where: { phoneNumber }});
}

// Create admin
export function createAdmin(data) {
  return prisma.user.create({data});
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
    where: {role: "admin"},
    orderBy: {createdAt: "desc"}
  });
}
//Deactivate admin
export function deactivateAdmin(id) {
  return prisma.user.update({
    where: { id },
    data: {status: "deactivated"},
  });
}

//Remove all current assignments
export function deleteAssignments(adminId) {
  return prisma.adminGroupAssignment.deleteMany({where: {adminId}});
}

//Create new assignments
export function createAssignments(adminId, groupIds, assignedById) {
  return prisma.adminGroupAssignment.createMany({
    data: groupIds.map((groupId) => ({adminId,groupId,assignedById}))
  });
}

// Assigned groups
 export function getAssignedGroups(adminId) {
  return prisma.adminGroupAssignment.findMany({where: {adminId},include: {group: true}});
}

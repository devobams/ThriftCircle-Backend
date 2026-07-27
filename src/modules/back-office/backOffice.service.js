import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";
import {findAdminByPhoneNumber,createAdmin,findAllAdmins,findAdminById,deactivateAdmin,deleteAssignments,createAssignments} from "./backOffice.model.js";
import {getAssignedGroups,getAssignedDisputes,resolveDispute,getPlatformAnalytics} from "./backOffice.model.js";

const SALT_ROUNDS = 10;

function toSafeAdmin(admin) {
  const { passwordHash, ...safeAdmin } = admin;
  return safeAdmin;
}
// Create Admin
export async function createAdminAccount(data, superAdminId) {
  const existing = await findAdminByPhoneNumber(data.phone_number);

  if (existing) {
    const err = new Error("Phone number is already registered");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const admin = await createAdmin({
    fullName: data.full_name,
    phoneNumber: data.phone_number,
    email: data.email,
    passwordHash,
    role: "admin",
    createdById: superAdminId,
  });

  if (data.group_ids.length > 0) {
    await createAssignments(
      admin.id,
      data.group_ids,
      superAdminId
    );
  }
  return {admin: toSafeAdmin(admin),
  };
}

//List Admins
export async function listAdmins() {
  const admins = await findAllAdmins();
  return admins.map(toSafeAdmin);
}

// Deactivate Admin
export async function deactivateAdminAccount(adminId) {
  const admin = await findAdminById(adminId);

  if (!admin) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }
  await deactivateAdmin(adminId);
  return {message: "Admin deactivated successfully"};
}

// Update Assignments
export async function updateAssignments(adminId,groupIds,superAdminId
) {
  const admin = await findAdminById(adminId);

  if (!admin) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }
  await deleteAssignments(adminId);
  await createAssignments(adminId,groupIds,superAdminId);
  return {message: "Assignments updated successfully"};
}

// Scoped Groups
export async function listAssignedGroups(adminId) {
  return await getAssignedGroups(adminId);
}

// Scoped Disputes
export async function listAssignedDisputes(adminId) {
  const assignments = await getAssignedGroups(adminId);
  const groupIds = assignments.map((assignment) => assignment.groupId);
  return await getAssignedDisputes(groupIds);
}

export async function resolveAdminDispute(disputeId,data,adminId) {
  const dispute = await prisma.dispute.findUnique({
    where: {id: disputeId}
  });

  if (!dispute) {
    const err = new Error("Dispute not found");
    err.status = 404;
    throw err;
  }

  const assignments = await getAssignedGroups(adminId);
  const assignedGroupIds = assignments.map((assignment) => assignment.groupId);
  
  if(!assignedGroupIds.includes(dispute.groupId)){
    const err = new Error ("This dispute is not in one of your assigned groups");
    err.status = 403;
    throw err;
  }

  if (dispute.status === "resolved") {
    const err = new Error("Dispute is already resolved");
    err.status = 409;
    throw err;
  }
  const updatedDispute = await resolveDispute(disputeId);
  return {message: "Dispute resolved successfully",dispute: updatedDispute};
}

// Platform Analytics
export async function getAnalytics() {
  const [totalUsers,totalGroups,activeGroups,openDisputes] = await getPlatformAnalytics();
  return {
    total_users: totalUsers,
    total_groups: totalGroups,
    active_groups: activeGroups,
    open_disputes: openDisputes
  };
}
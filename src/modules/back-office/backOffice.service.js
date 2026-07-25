import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";
import {findAdminByPhoneNumber,createAdmin} from "./backOffice.model.js";

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


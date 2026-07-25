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
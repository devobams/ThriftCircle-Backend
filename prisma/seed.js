import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { phoneNumber: process.env.SUPER_ADMIN_PHONE },
    update: {},
    create: {
      fullName: "Super Admin",
      phoneNumber: process.env.SUPER_ADMIN_PHONE,
      passwordHash,
      role: "super_admin",
    },
  });
  console.log("Super Admin seeded (or already existed).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
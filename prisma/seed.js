import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Seed Super Admin
  const superAdminPasswordHash = await bcrypt.hash(
    process.env.SUPER_ADMIN_PASSWORD,
    10
  );

  await prisma.user.upsert({
    where: {
      phoneNumber: process.env.SUPER_ADMIN_PHONE,
    },
    update: {},
    create: {
      fullName: "Super Admin",
      phoneNumber: process.env.SUPER_ADMIN_PHONE,
      passwordHash: superAdminPasswordHash,
      role: "super_admin",
    },
  });

  // Seed Organizer
  const organizerPasswordHash = await bcrypt.hash("password123", 10);

  const organizer = await prisma.user.upsert({
    where: {
      phoneNumber: "+2348011111111",
    },
    update: {},
    create: {
      fullName: "Test Organizer",
      phoneNumber: "+2348011111111",
      passwordHash: organizerPasswordHash,
      role: "organizer",
    },
  });

  // Seed Group
  const group = await prisma.group.upsert({
    where: {
      id: "11111111-1111-1111-1111-111111111111",
    },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Test Savings Group",
      organizerId: organizer.id,
      contributionAmount: 5000,
      totalSlots: 2,
      frequency: "weekly",
      payoutOrderType: "fixed",
      status: "active",
    },
  });

  // Seed Member 1
  const member1PasswordHash = await bcrypt.hash("password123", 10);

  const member1 = await prisma.user.upsert({
    where: {
      phoneNumber: "+2348022222222",
    },
    update: {},
    create: {
      fullName: "Elias Israel",
      phoneNumber: "+2348022222222",
      passwordHash: member1PasswordHash,
      role: "member",
    },
  });

  // Seed Member 2
  const member2PasswordHash = await bcrypt.hash("password123", 10);

  const member2 = await prisma.user.upsert({
    where: {
      phoneNumber: "+2348033333333",
    },
    update: {},
    create: {
      fullName: "Delvin Jaiyola",
      phoneNumber: "+2348033333333",
      passwordHash: member2PasswordHash,
      role: "member",
    },
  });

  // Add Member 1 to the Group
  const member1Membership = await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: member1.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      userId: member1.id,
      joinStatus: "active",
    },
  });

  // Add Member 2 to the Group
  const member2Membership = await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: member2.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      userId: member2.id,
      joinStatus: "active",
    },
  });

  // Seed Contribution Cycle
  const cycle = await prisma.contributionCycle.upsert({
    where: {
      groupId_cycleNumber: {
        groupId: group.id,
        cycleNumber: 1,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      cycleNumber: 1,
      status: "active",
    },
  });

  // Seed Member 1 Contribution
  await prisma.contribution.upsert({
    where: {
      cycleId_groupMemberId: {
        cycleId: cycle.id,
        groupMemberId: member1Membership.id,
      },
    },
    update: {},
    create: {
      cycleId: cycle.id,
      groupMemberId: member1Membership.id,
      dueDate: new Date("2026-07-30"),
      amount: 5000,
      status: "confirmed",
      confirmedById: organizer.id,
      confirmedAt: new Date(),
    },
  });

  // Seed Member 2 Contribution
  await prisma.contribution.upsert({
    where: {
      cycleId_groupMemberId: {
        cycleId: cycle.id,
        groupMemberId: member2Membership.id,
      },
    },
    update: {},
    create: {
      cycleId: cycle.id,
      groupMemberId: member2Membership.id,
      dueDate: new Date("2026-07-31"),
      amount: 5000,
      status: "pending",
    },
  });

  console.log("Test data seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
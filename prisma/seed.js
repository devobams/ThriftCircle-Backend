import prisma from "../src/config/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  // Seed Super Admin
  const superAdminPasswordHash = await bcrypt.hash(
    process.env.SUPER_ADMIN_PASSWORD,
    10
  );

  await prisma.user.upsert({
    where: { phoneNumber: process.env.SUPER_ADMIN_PHONE },
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
    where: { phoneNumber: "+2348011111111" },
    update: {},
    create: {
      fullName: "Test Organizer",
      phoneNumber: "+2348011111111",
      passwordHash: organizerPasswordHash,
      role: "organizer",
    },
  });

  // Seed Group
  // totalSlots is now 3: Organizer (slot 1) + 2 Members (slots 2-3)
  const group = await prisma.group.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Test Savings Group",
      organizerId: organizer.id,
      contributionAmount: 5000,
      totalSlots: 3,
      frequency: "weekly",
      payoutOrderType: "fixed",
      status: "active",
    },
  });

  // Organizer participates in their own group and always takes slot 1
  const organizerMembership = await prisma.groupMember.upsert({
    where: {
      groupId_userId: { groupId: group.id, userId: organizer.id },
    },
    update: {},
    create: {
      groupId: group.id,
      userId: organizer.id,
      position: 1,
      joinStatus: "active",
    },
  });

  // Seed Member 1
  const member1PasswordHash = await bcrypt.hash("password123", 10);

  const member1 = await prisma.user.upsert({
    where: { phoneNumber: "+2348022222222" },
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
    where: { phoneNumber: "+2348033333333" },
    update: {},
    create: {
      fullName: "Delvin Jaiyola",
      phoneNumber: "+2348033333333",
      passwordHash: member2PasswordHash,
      role: "member",
    },
  });

  // Member 1 takes slot 2
  const member1Membership = await prisma.groupMember.upsert({
    where: {
      groupId_userId: { groupId: group.id, userId: member1.id },
    },
    update: {},
    create: {
      groupId: group.id,
      userId: member1.id,
      position: 2,
      joinStatus: "active",
    },
  });

  // Member 2 takes slot 3
  const member2Membership = await prisma.groupMember.upsert({
    where: {
      groupId_userId: { groupId: group.id, userId: member2.id },
    },
    update: {},
    create: {
      groupId: group.id,
      userId: member2.id,
      position: 3,
      joinStatus: "active",
    },
  });

  // Seed Contribution Cycle
  const cycle = await prisma.contributionCycle.upsert({
    where: {
      groupId_cycleNumber: { groupId: group.id, cycleNumber: 1 },
    },
    update: {},
    create: {
      groupId: group.id,
      cycleNumber: 1,
      status: "active",
    },
  });

  // Organizer's contribution for round 1 — they contribute too, no exemption
  // even though slot 1 is scheduled to receive this round's payout
  // (confirmed by direct organizer interview — see NOTES.md Parked Decisions)
  await prisma.contribution.upsert({
    where: {
      cycleId_groupMemberId: {
        cycleId: cycle.id,
        groupMemberId: organizerMembership.id,
      },
    },
    update: {},
    create: {
      cycleId: cycle.id,
      groupMemberId: organizerMembership.id,
      dueDate: new Date("2026-07-30"),
      amount: 5000,
      status: "confirmed",
      confirmedById: organizer.id,
      confirmedAt: new Date(),
    },
  });

  // Member 1 contribution — confirmed, for testing schedule/history views
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

  // Member 2 contribution — left "pending", for testing the pay/confirm/reject flow
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
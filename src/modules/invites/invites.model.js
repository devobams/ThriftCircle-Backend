
import prisma from "../../config/prisma.js";

export function createInviteRecord(data) {
  return prisma.invite.create({ data });
}

export function findInviteByCode(code) {
  return prisma.invite.findUnique({
    where: { code },
    include: {
      group: {
        include: { organizer: true },
      },
    },
  });
}

export function markInviteUsed(inviteId) {
  return prisma.invite.update({
    where: { id: inviteId },
    data: { status: "used" },
  });
}

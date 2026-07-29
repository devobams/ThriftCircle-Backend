import {
  createGroupWithOrganizer,
  findGroupById,
  findMembership,
  countActiveMembers,
} from "./groups.model.js";

export async function createGroup(organizerId, data) {
  const group = await createGroupWithOrganizer(organizerId, data);

  return {
    id: group.id,
    name: group.name,
    contribution_amount: group.contributionAmount,
    total_slots: group.totalSlots,
    frequency: group.frequency,
    payout_order_type: group.payoutOrderType,
    start_date: group.startDate,
    status: group.status,
    organizer_position: 1,
    slots_filled: 1,
    slots_available: group.totalSlots - 1,
  };
}

export async function getGroupById(groupId, userId) {
  const group = await findGroupById(groupId);
  if (!group) return { notFound: true };

  const isOwner = group.organizerId === userId;
  const membership = await findMembership(groupId, userId);
  const isActiveMember = membership?.joinStatus === "active";

  if (!isOwner && !isActiveMember) {
    return { forbidden: true };
  }

  const slotsFilled = await countActiveMembers(groupId);

  return {
    id: group.id,
    name: group.name,
    contribution_amount: group.contributionAmount,
    frequency: group.frequency,
    payout_order_type: group.payoutOrderType,
    status: group.status,
    total_slots: group.totalSlots,
    slots_filled: slotsFilled,
    slots_available: group.totalSlots - slotsFilled,
  };
}

export async function joinGroup(groupId, userId, data) {
  try {
    return await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: groupId },
        include: { groupMembers: { where: { joinStatus: "active" } } },
      });
      if (!group) {
        const err = new Error("Group not found");
        err.status = 404;
        throw err;
      }

      const slotsFilled = group.groupMembers.length;
      if (slotsFilled >= group.totalSlots) {
        const err = new Error("This group is already full");
        err.status = 409;
        throw err;
      }

      const takenPositions = group.groupMembers.map((m) => m.position);
      let position = data.position;

      if (position) {
        if (position > group.totalSlots) {
          const err = new Error(`Position must be between 2 and ${group.totalSlots}`);
          err.status = 400;
          throw err;
        }
        if (takenPositions.includes(position)) {
          const available = [];
          for (let i = 2; i <= group.totalSlots; i++) {
            if (!takenPositions.includes(i)) available.push(i);
          }
          const err = new Error(`Slot ${position} is already taken. Available slots: ${available.join(", ")}`);
          err.status = 409;
          throw err;
        }
      } else {
        for (let i = 2; i <= group.totalSlots; i++) {
          if (!takenPositions.includes(i)) {
            position = i;
            break;
          }
        }
      }

      return tx.groupMember.create({
        data: { groupId, userId, position, joinStatus: "active" },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    // Race lost against a concurrent join for the same slot —
    // the DB's @@unique([groupId, position]) constraint caught it.
    if (err.code === "P2002") {
      const conflictErr = new Error("That slot was just taken by someone else — please try again");
      conflictErr.status = 409;
      throw conflictErr;
    }
    throw err;
  }
}

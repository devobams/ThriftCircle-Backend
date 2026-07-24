
import { createGroupSchema, groupIdParamSchema } from "./groups.validation.js";
import { createGroup, getGroupById } from "./groups.service.js";

export async function handleCreateGroup(req, res) {
  const parsed = createGroupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request body",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const organizerId = req.user.id;

  const group = await createGroup(organizerId, parsed.data);

  return res.status(201).json({
    id: group.id,
    name: group.name,
    contribution_amount: group.contributionAmount,
    total_slots: group.totalSlots,
    frequency: group.frequency,
    payout_order_type: group.payoutOrderType,
    status: group.status,
  });
}

export async function handleGetGroupById(req, res) {
  const parsedParams = groupIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ message: "Invalid group id" });
  }

  const userId = req.user.id;
  const result = await getGroupById(parsedParams.data.id, userId);

  if (result.notFound) {
    return res.status(404).json({ message: "Group not found" });
  }

  if (result.forbidden) {
    return res.status(403).json({ message: "You are not a member of this group" });
  }

  return res.status(200).json(result);
}

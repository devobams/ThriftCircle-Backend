import { createGroupSchema, groupIdParamSchema } from "./groups.validation.js";
import { createGroup, getGroupById } from "./groups.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const handleCreateGroup = asyncHandler(async (req, res) => {
  const data = createGroupSchema.parse(req.body);
  const organizerId = req.user.id;

  const group = await createGroup(organizerId, data);

  res.status(201).json(group);
});

export const handleGetGroupById = asyncHandler(async (req, res) => {
  const { id } = groupIdParamSchema.parse(req.params);
  const userId = req.user.id;

  const result = await getGroupById(id, userId);

  if (result.notFound) {
    return res.status(404).json({ message: "Group not found" });
  }
  if (result.forbidden) {
    return res.status(403).json({ message: "You are not a member of this group" });
  }

  res.status(200).json(result);
});

import {
  createInviteSchema,
  groupIdParamSchema,
  inviteCodeParamSchema,
} from "./invites.validation.js";
import {
  createInvite,
  getInvitePreview,
  regenerateInvite,
  disableInvite,
} from "./invites.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const INVITE_ERROR_MESSAGES = {
  invalid: "This invite code is invalid",
  already_used: "This invite has already been used",
  expired: "This invite has expired",
};

export const handleCreateInvite = asyncHandler(async (req, res) => {
  const { id: groupId } = groupIdParamSchema.parse(req.params);
  const data = createInviteSchema.parse(req.body);

  const result = await createInvite(groupId, req.user.id, data);

  if (result.notFound) return res.status(404).json({ message: "Group not found" });
  if (result.forbidden) return res.status(403).json({ message: "You do not own this group" });

  res.status(201).json(result);
});

export const handleRegenerateInvite = asyncHandler(async (req, res) => {
  const { id: groupId } = groupIdParamSchema.parse(req.params);

  const result = await regenerateInvite(groupId, req.user.id);

  if (result.notFound) return res.status(404).json({ message: "Group not found" });
  if (result.forbidden) return res.status(403).json({ message: "You do not own this group" });

  res.status(201).json(result);
});

export const handleDisableInvite = asyncHandler(async (req, res) => {
  const { id: groupId } = groupIdParamSchema.parse(req.params);

  const result = await disableInvite(groupId, req.user.id);

  if (result.notFound) return res.status(404).json({ message: "Group not found" });
  if (result.forbidden) return res.status(403).json({ message: "You do not own this group" });
  if (result.noneActive) return res.status(404).json({ message: "No active invite to disable" });

  res.status(200).json({ message: "Invite code disabled" });
});

export const handleGetInvitePreview = asyncHandler(async (req, res) => {
  const { code } = inviteCodeParamSchema.parse(req.params);

  const result = await getInvitePreview(code);

  if (!result.valid) {
    const message = INVITE_ERROR_MESSAGES[result.reason] ?? "Invalid invite";
    return res.status(404).json({ message });
  }

  res.status(200).json(result);
});

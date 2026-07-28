
import {
  groupIdParamSchema,
  joinRequestIdParamSchema,
  createJoinRequestSchema,
  selectPositionSchema,
} from "./join-requests.validation.js";
import {
  createJoinRequest,
  listPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  getAvailableSlots,
  selectPosition,
} from "./join-requests.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const handleCreateJoinRequest = asyncHandler(async (req, res) => {
  const { id: groupId } = groupIdParamSchema.parse(req.params);
  const { invite_code } = createJoinRequestSchema.parse(req.body);

  const result = await createJoinRequest(groupId, req.user.id, invite_code);

  if (result.invalid) {
    return res.status(400).json({ message: `Invite code ${result.reason.replace("_", " ")}` });
  }
  if (result.alreadyRequested) {
    return res.status(409).json({ message: "You already have a pending request for this group" });
  }

  res.status(202).json({ message: "Join request submitted, pending organizer approval" });
});

export const handleListPendingJoinRequests = asyncHandler(async (req, res) => {
  const { id: groupId } = groupIdParamSchema.parse(req.params);

  const result = await listPendingJoinRequests(groupId, req.user.id);

  if (result.notFound) return res.status(404).json({ message: "Group not found" });
  if (result.forbidden) return res.status(403).json({ message: "You do not own this group" });

  res.status(200).json(result.requests);
});

export const handleApproveJoinRequest = asyncHandler(async (req, res) => {
  const { id } = joinRequestIdParamSchema.parse(req.params);

  const result = await approveJoinRequest(id, req.user.id);

  if (result.notFound) return res.status(404).json({ message: "Join request not found" });
  if (result.forbidden) return res.status(403).json({ message: "You do not own this group" });
  if (result.alreadyReviewed) return res.status(409).json({ message: "This request has already been reviewed" });

  res.status(200).json({ message: "Join request approved" });
});

export const handleRejectJoinRequest = asyncHandler(async (req, res) => {
  const { id } = joinRequestIdParamSchema.parse(req.params);

  const result = await rejectJoinRequest(id, req.user.id);

  if (result.notFound) return res.status(404).json({ message: "Join request not found" });
  if (result.forbidden) return res.status(403).json({ message: "You do not own this group" });
  if (result.alreadyReviewed) return res.status(409).json({ message: "This request has already been reviewed" });

  res.status(200).json({ message: "Join request rejected" });
});

export const handleGetAvailableSlots = asyncHandler(async (req, res) => {
  const { id: groupId } = groupIdParamSchema.parse(req.params);

  const result = await getAvailableSlots(groupId, req.user.id);

  if (result.notFound) return res.status(404).json({ message: "Group not found" });
  if (result.forbidden) return res.status(403).json({ message: "You are not approved to view this group's slots" });

  res.status(200).json(result);
});
export const handleSelectPosition = asyncHandler(async (req, res) => {
  const { id } = joinRequestIdParamSchema.parse(req.params);
  const { position } = selectPositionSchema.parse(req.body);

  const result = await selectPosition(id, req.user.id, position);

  if (result.notFound) return res.status(404).json({ message: "Join request not found" });
  if (result.forbidden) return res.status(403).json({ message: "This is not your join request" });
  if (result.notApproved) return res.status(400).json({ message: "This request has not been approved yet" });
  if (result.invalidPosition) return res.status(400).json({ message: "That position doesn't exist in this group" });
  if (result.positionTaken) return res.status(409).json({ message: "This position was just taken, please pick another" });
  if (result.alreadyMember) return res.status(409).json({ message: "You are already a member of this group" });

  res.status(201).json({ message: "Joined successfully", position: result.position });
});
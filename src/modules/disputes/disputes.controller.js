import { asyncHandler } from "../../utils/asyncHandler.js";
import { createDisputeSchema, groupIdParamSchema, disputeIdParamSchema } from "./disputes.validation.js";
import { raiseDispute, getDisputeById, listGroupDisputes } from "./disputes.service.js"

export const handleRaiseDispute = asyncHandler(async (req, res) => {
  const { id } = groupIdParamSchema.parse(req.params);
  const data = createDisputeSchema.parse(req.body);
  const dispute = await raiseDispute(id, req.user.id, data);
  res.status(201).json(dispute);
});

export const handleGetDispute = asyncHandler(async (req, res) => {
  const { id } = disputeIdParamSchema.parse(req.params);
  const result = await getDisputeById(id, req.user.id);
  if (result.notFound) return res.status(404).json({ message: "Dispute not found" });
  if (result.forbidden) return res.status(403).json({ message: "Not authorized to view this dispute" });
  res.status(200).json(result.dispute);
});

export const handleListGroupDisputes = asyncHandler(async (req, res) => {
  const { id } = groupIdParamSchema.parse(req.params);
  const result = await listGroupDisputes(id, req.user.id);
  if (result.notFound) return res.status(404).json({ message: "Group not found" });
  if (result.forbidden) return res.status(403).json({ message: "Not authorized to view this group's disputes" });
  res.status(200).json(result.disputes);
});
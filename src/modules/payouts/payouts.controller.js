import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  groupIdParamsSchema,
  payoutOrderIdParamsSchema,
  payoutIdParamsSchema,
  recordPayoutSchema,
  updatePayoutStatusSchema,
} from "./payouts.validation.js";

import { getPayoutOrder, getPayoutHistory, recordPayout, updatePayoutStatus } from "./payouts.service.js";


export const getGroupPayoutOrder = asyncHandler(async (req, res) => {
  const { id } = groupIdParamsSchema.parse(req.params);
  res.status(200).json(await getPayoutOrder(id, req.user.id));
});

// payoutorder vs grouppayout => payoutorder is the plan, grouppayout is the execution
export const getGroupPayouts = asyncHandler(async (req, res) => {
  const { id } = groupIdParamsSchema.parse(req.params);
  res.status(200).json(await getPayoutHistory(id, req.user.id));
});

export const recordGroupPayout = asyncHandler(async (req, res) => {
  const { id } = payoutOrderIdParamsSchema.parse(req.params);
  const data = recordPayoutSchema.parse(req.body);
  const payout = await recordPayout(id, req.user.id, data);
  res.status(201).json({ message: "Payout recorded successfully.", payout });
});

export const updateGroupPayoutStatus = asyncHandler(async (req, res) => {
  const { id } = payoutIdParamsSchema.parse(req.params);
  const { status } = updatePayoutStatusSchema.parse(req.body);
  const payout = await updatePayoutStatus(id, req.user.id, status);
  res.status(200).json({ message: "Payout status updated.", payout });
});
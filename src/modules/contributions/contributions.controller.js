import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  groupScheduleParamsSchema,
  contributionIdParamsSchema,
  submitPaymentSchema,
  confirmContributionSchema,
  rejectContributionSchema,
  startRotationSchema,
} from "./contributions.validation.js";

import {
  getContributionSchedule,
  submitPayment,
  confirmContribution,
  rejectContribution,
  startRotation,
  getContributionDetail,
} from "./contributions.service.js";

export const getSchedule = asyncHandler(async (req, res) => {
  const { id } = groupScheduleParamsSchema.parse(req.params);
  const schedule = await getContributionSchedule(id, req.user.id);
  res.status(200).json(schedule);
});

export const submitContributionPayment = asyncHandler(async (req, res) => {
  const { id } = contributionIdParamsSchema.parse(req.params);
  const { proofOfPaymentUrl } = submitPaymentSchema.parse(req.body);
  const contribution = await submitPayment(id, req.user.id, proofOfPaymentUrl);
  res.status(200).json({
    message: "Payment submitted successfully.",
    contribution,
  });
});

export const getContributionById = asyncHandler(async (req, res) => {
  const { id } = contributionIdParamsSchema.parse(req.params);
  const contribution = await getContributionDetail(id, req.user.id);
  res.status(200).json(contribution);
});

export const confirmContributionPayment = asyncHandler(async (req, res) => {
  const { id } = contributionIdParamsSchema.parse(req.params);
  const { note } = confirmContributionSchema.parse(req.body);
  const contribution = await confirmContribution(id, req.user.id, note);
  res.status(200).json({
    message: "Contribution confirmed successfully.",
    contribution,
  });
});

export const rejectContributionPayment = asyncHandler(async (req, res) => {
  const { id } = contributionIdParamsSchema.parse(req.params);
  const { rejectionReason, note } = rejectContributionSchema.parse(req.body);
  const contribution = await rejectContribution(id, req.user.id, rejectionReason, note);
  res.status(200).json({
    message: "Contribution rejected successfully.",
    contribution,
  });
});

export const startGroupRotation = asyncHandler(async (req, res) => {
  const { id } = groupScheduleParamsSchema.parse(req.params);
  const { start_date } = startRotationSchema.parse(req.body);
  const cycles = await startRotation(id, req.user.id, start_date);
  res.status(201).json({ message: "Rotation started successfully.", cyclesCreated: cycles.length });
});
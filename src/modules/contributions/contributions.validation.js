import { z } from "zod";

export const groupScheduleParamsSchema = z.object({
  id: z.string().uuid("Invalid group id"),
});

export const contributionIdParamsSchema = z.object({
  id: z.string().uuid("Invalid contribution id"),
});

export const submitPaymentSchema = z.object({
  proofOfPaymentUrl: z
    .string()
    .trim()
    .min(1, "Proof of payment is required"),
});

export const confirmContributionSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export const rejectContributionSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, "Rejection reason is required"),

  note: z
    .string()
    .trim()
    .max(500)
    .optional(),
});
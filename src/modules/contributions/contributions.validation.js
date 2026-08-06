import { z } from "zod";

export const groupScheduleParamsSchema = z.object({
  id: z.string().uuid("Invalid group id"),
});

export const contributionIdParamsSchema = z.object({
  id: z.string().uuid("Invalid contribution id"),
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

export const startRotationSchema = z.object({
  start_date: z.coerce.date().refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "start_date cannot be in the past" }
  ).optional(),
});

export const cycleContributionsParamsSchema = z.object({
  id: z.string().uuid("Invalid group id"),
  cycleId: z.string().uuid("Invalid cycle id"),
});
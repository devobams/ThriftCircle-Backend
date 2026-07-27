// payouts.validation.js
import { z } from "zod";

export const groupIdParamsSchema = z.object({ id: z.string().uuid("Invalid group id") });
export const payoutOrderIdParamsSchema = z.object({ id: z.string().uuid("Invalid payout order id") });
export const payoutIdParamsSchema = z.object({ id: z.string().uuid("Invalid payout id") });

export const recordPayoutSchema = z.object({
  reference: z.string().trim().optional(),
  proofUrl: z.string().trim().optional(),
});

export const updatePayoutStatusSchema = z.object({
  status: z.enum(["completed", "failed", "reversed"]),
});
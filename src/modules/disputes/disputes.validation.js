import { z } from "zod";

export const createDisputeSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  involved_member_id: z.string().uuid("Invalid member id").optional(),
  contribution_id: z.string().uuid("Invalid contribution id").optional(),
});

export const groupIdParamSchema = z.object({
  id: z.string().uuid("Invalid group id"),
});

export const disputeIdParamSchema = z.object({
  id: z.string().uuid("Invalid dispute id"),
});
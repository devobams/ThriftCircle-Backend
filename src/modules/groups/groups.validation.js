import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  contribution_amount: z
    .number()
    .positive("Contribution amount must be greater than 0"),
  total_slots: z
    .number()
    .int("total_slots must be a whole number")
    .min(2, "A group needs at least 2 slots")
    .max(100, "A group cannot exceed 100 slots"),
  frequency: z.enum(["weekly", "monthly"]),
  payout_order_type: z.enum(["fixed", "rotating"]),
});

export const groupIdParamSchema = z.object({
  id: z.string().uuid("Invalid group id"),
});

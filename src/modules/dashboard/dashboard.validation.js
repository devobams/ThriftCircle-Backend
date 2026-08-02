import { z } from "zod";

export const groupIdParamsSchema = z.object({
  id: z.string().uuid("Invalid group ID."),
});

export const reportParamsSchema = z.object({
  id: z.string().uuid("Invalid group ID."),
  cycleId: z.string().uuid("Invalid cycle ID."),
});
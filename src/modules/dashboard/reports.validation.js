import { z } from "zod";

export const reportParamsSchema = z.object({
  id: z.string().uuid("Invalid group ID."),
  cycleId: z.string().uuid("Invalid contribution cycle ID."),
});
import { z } from "zod";

export const createInviteSchema = z.object({
  invited_phone_number: z.string().min(10).optional(),
  expires_in_days: z.number().int().min(1).max(30).optional(),
});

export const groupIdParamSchema = z.object({
  id: z.string().uuid("Invalid group id"),
});

export const inviteCodeParamSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

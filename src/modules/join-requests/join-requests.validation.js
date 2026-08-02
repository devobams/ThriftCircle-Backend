import { z } from "zod";

export const groupIdParamSchema = z.object({
  id: z.string().uuid("Invalid group id"),
});

export const joinRequestIdParamSchema = z.object({
  id: z.string().uuid("Invalid join request id"),
});

export const createJoinRequestSchema = z.object({
  invite_code: z.string().min(1, "Invite code is required"),
});

export const selectPositionSchema = z.object({
  position: z.number().int().min(2, "Position 1 is reserved for the organizer"),
});

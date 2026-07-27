import { z } from "zod";

export const createAdminSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters"),

  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  email: z
    .string()
    .email("Invalid email address")
    .optional(),

  group_ids: z
    .array(z.string().uuid("Invalid group id"))
    .default([]),
});

export const adminIdParamSchema = z.object({
  id: z.string().uuid("Invalid admin id"),
});

export const updateAssignmentsSchema = z.object({
  group_ids: z
    .array(z.string().uuid("Invalid group id"))
    .min(1, "At least one group must be assigned"),
});

export const disputeIdParamSchema = z.object({
  id: z.string().uuid("Invalid dispute id"),
});

export const resolveDisputeSchema = z.object({
  status: z.enum(["resolved"]),
});

export const analyticsQuerySchema = z.object({});

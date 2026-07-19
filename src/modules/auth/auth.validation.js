import { z } from "zod";

export const registerSchema = z.object({
  intent: z.enum(["organizer", "member"]),
  full_name: z.string().min(2),
  phone_number: z.string().min(10),
  password: z.string().min(6),
  email: z.string().email().optional(),
  invite_code: z.string().optional(), // required only when intent === "member"
});

export const loginSchema = z.object({
  phone_number: z.string().min(10),
  password: z.string().min(6),
});
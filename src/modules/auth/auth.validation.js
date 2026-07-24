import { z } from "zod";

const organizerRegisterSchema = z.object({
  intent: z.literal("organizer"),
  full_name: z.string().min(2),
  phone_number: z.string().min(10),
  password: z.string().min(6),
  email: z.string().email().optional(),
});

const memberRegiserSchema = z.object({
  intent: z.literal("member"),
  full_name: z.string().min(2),
  phone_number: z.string().min(10),
  password: z.string().min(6),
  email: z.string().email().optional(),
  invite_code: z.string().min(1)
})


export const registerSchema = z.discriminatedUnion("intent", 
  [organizerRegisterSchema,
    memberRegiserSchema
  ]);


export const loginSchema = z.object({
  phone_number: z.string().min(10),
  password: z.string().min(6),
});
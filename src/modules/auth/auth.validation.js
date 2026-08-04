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
  // invite_code: z.string().min(1)
})


export const registerSchema = z.discriminatedUnion("intent", 
  [organizerRegisterSchema,
    memberRegiserSchema
  ]);


export const loginSchema = z.object({
  phone_number: z.string().min(10),
  password: z.string().min(6),
});


export const forgotPasswordSchema = z.object({
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits"),
});


export const verifyResetOtpSchema = z.object({
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits"),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits"),
});


export const resetPasswordSchema = z.object({
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits"),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits"),

  new_password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});
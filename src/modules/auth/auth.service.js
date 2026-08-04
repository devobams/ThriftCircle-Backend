import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  findUserByPhoneNumber,
  createUser,
  findUserById,
  savePasswordResetOtp,
  updatePassword,
  clearPasswordResetOtp,
} from "./auth.model.js";
import { sendOtpSms } from "../../utils/sendOtpSms.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    env.jwtSecret,
    {expiresIn: env.jwtExpiresIn}
  )
}

// Strip passwordHash before ever sending a user object back to the client
// neer let a hash leave the server, even accidentally
function toSafeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Helper function to generate a 6-digit OTP
function generateOtp () {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerUser(data) {
  const existing = await findUserByPhoneNumber(data.phone_number);
  if (existing) {
    const err = new Error("Phone number is already registered");
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await createUser({
    fullName: data.full_name,
    phoneNumber: data.phone_number,
    email: data.email,
    passwordHash,
    role: data.intent,
  });
  const token = signToken(user);
  return { user: toSafeUser(user), token }; // no group_context anymore
}

export async function loginUser(data) {
  // first find user if exists
  const user = await findUserByPhoneNumber(data.phone_number);
  if (!user) {
    const err = new Error("Invalid phone number or password");
    err.status = 401;
    throw err;
  }

  // check password
  const isCorrect = await bcrypt.compare(data.password, user.passwordHash);
  if (!isCorrect) {
    const err = new Error("Invalid phone number or password");
    err.status = 401;
    throw err;
  }

  // check user status if they are active or deactivated
  if (user.status === "deactivated") {
    const err = new Error("This account has been deactivated");
    err.status = 403;
    throw err;
  }

  // sign token
  const token = signToken(user);

  return {
    user: toSafeUser(user),
    token,
  };
}

export async function getUserById(id) {
  const user = await findUserById(id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return toSafeUser(user);
}

export async function forgotPassword(data) {
  const user = await findUserByPhoneNumber(data.phone_number);

  if (!user) {
    const err = new Error("Phone number does not exist");
    err.status = 404;
    throw err;
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await savePasswordResetOtp(user.id, hashedOtp, expiresAt);
  await sendOtpSms(user.phoneNumber, otp);

  return {
    message: "Password reset OTP sent successfully",
  };
}

export async function verifyResetOtp(data) {
  const user = await findUserByPhoneNumber(
    data.phone_number,
    data.otp
  );

  if (!user) {
    const err = new Error("Phone number does not exist");
    err.status = 404;
    throw err;
  }

  if (!user.passwordResetOtpExpiresAt || user.passwordResetOtpExpiresAt < new Date()) {
    const err = new Error("OTP has expired");
    err.status = 400;
    throw err;
  }

  const isOtpValid = await bcrypt.compare(data.otp, user.passwordResetOtp);
  if (!isOtpValid) {
    const err = new Error("Invalid OTP");
    err.status = 400;
    throw err;
  }

  return {
    message: "OTP verified successfully",
  };
}

export async function resetPassword(data) {
  const user = await findUserByPhoneNumber(
    data.phone_number
  );

  if (!user) {
    const err = new Error("Phone number does not exist");
    err.status = 404;
    throw err;
  }

  if (!user.passwordResetOtpExpiresAt || user.passwordResetOtpExpiresAt < new Date()) {
    const err = new Error("OTP has expired");
    err.status = 400;
    throw err;
  }

  const isOtpValid = await bcrypt.compare(data.otp, user.passwordResetOtp);
  if (!isOtpValid) {
    const err = new Error("Invalid OTP");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(
    data.new_password,
    SALT_ROUNDS
  );

  await updatePassword(user.id, passwordHash);
  await clearPasswordResetOtp(user.id);
  return {
    message: "Password reset successfully",
  };
}
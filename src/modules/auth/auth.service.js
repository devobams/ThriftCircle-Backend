import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { redis } from "../../config/redis.js";

import { env } from "../../config/env.js";
import { toInternationalFormat } from "../../utils/phoneNumber.js";
import { sendOtpEmail } from "../../utils/sendOtpEmail.js";

import {
  findUserByPhoneNumber,
  createUser,
  findUserById,
  savePasswordResetOtp,
  updatePassword,
  clearPasswordResetOtp,
  findUserByResetToken,
  savePasswordResetToken,
  clearPasswordResetToken,
  deactivateUser,
} from "./auth.model.js";
import { sendOtpSms } from "../../utils/sendOtpSms.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// Strip passwordHash before ever sending a user object back to the client
// neer let a hash leave the server, even accidentally
function toSafeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Helper function to generate a 6-digit OTP
function generateOtp() {
  return crypto.randomInt(100000, 1_000_000).toString();
}

export async function registerUser(data) {
  const normalizedPhone = toInternationalFormat(data.phone_number);
  const existing = await findUserByPhoneNumber(normalizedPhone);
  if (existing) {
    const err = new Error("Phone number is already registered");
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await createUser({
    fullName: data.full_name,
    phoneNumber: normalizedPhone,
    email: data.email,
    passwordHash,
    role: data.intent,
  });
  const token = signToken(user);
  return { user: toSafeUser(user), token };
}

export async function loginUser(data) {
  // first find user if exists
  const normalizedPhone = toInternationalFormat(data.phone_number);
  const user = await findUserByPhoneNumber(normalizedPhone);
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
  const normalizedPhone = toInternationalFormat(data.phone_number);
  const cooldownKey = `otp-cooldown:${normalizedPhone}`;

  let cooldownAcquired = false;
  try {
    const acquired = await redis.set(cooldownKey, "1", "EX", 60, "NX");
    if (!acquired) {
      const err = new Error("Please wait before requesting another OTP");
      err.status = 429;
      throw err;
    }
    cooldownAcquired = true;
  } catch (err) {
    if (err.status === 429) throw err;
    console.error("Redis cooldown check failed:", err.message);
  }

  try {
    const user = await findUserByPhoneNumber(normalizedPhone);

    if (user && user.email) {
      const otp = generateOtp();
      const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await savePasswordResetOtp(user.id, hashedOtp, expiresAt);

      if (env.nodeEnv === "production") {
        await sendOtpEmail(user.email, otp);
      } else {
        console.log(`[DEV MODE] OTP generated for user ${user.id} (${user.email}): ${otp}`);
      }
    }

    return { message: "If that phone number is registered with an email, an OTP has been sent." };
  } catch (err) {
    if (cooldownAcquired) {
      try {
        await redis.del(cooldownKey);
      } catch (delErr) {
        console.error("Failed to clear cooldown after send failure:", delErr.message);
      }
    }
    throw err;
  }
}

export async function verifyResetOtp(data) {
  const normalizedPhone = toInternationalFormat(data.phone_number);
  const user = await findUserByPhoneNumber(normalizedPhone);

  if (!user) {
    const err = new Error("Invalid OTP");
    err.status = 400;
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

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min to actually reset

  await savePasswordResetToken(user.id, hashedToken, tokenExpiresAt);

  return { message: "OTP verified successfully", reset_token: rawToken };
}

export async function resetPassword(data) {
  const hashedToken = crypto.createHash("sha256").update(data.reset_token).digest("hex");
  const user = await findUserByResetToken(hashedToken);

  if (!user) {
    const err = new Error("Invalid or expired reset token");
    err.status = 400;
    throw err;
  }

  if (!user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt < new Date()) {
    const err = new Error("Reset token has expired");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.new_password, SALT_ROUNDS);

  await updatePassword(user.id, passwordHash);
  await clearPasswordResetToken(user.id);
  return { message: "Password reset successfully" };
}

export async function deactivateUserAccount(id) {
  await deactivateUser(id);
  return { message: "Account deactivated successfully" };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function logoutUser(token, payload) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = payload.exp - nowInSeconds;

  if (ttlSeconds > 0) {
    await redis.set(`blacklist:${hashToken(token)}`, "1", "EX", ttlSeconds);
  }
  // if ttlSeconds <= 0, token was already expired anyway — nothing to blacklist

  return { message: "Logged out successfully" };
}
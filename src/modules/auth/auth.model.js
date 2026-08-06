import prisma from "../../config/prisma.js";

export function findUserByPhoneNumber(phoneNumber) {
    return prisma.user.findUnique({
        where: { phoneNumber },
    });
}

export function createUser(data) {
    return prisma.user.create({
        data,
    });
}

export function findUserById(id) {
    return prisma.user.findUnique({
        where: { id },
    });
}


// PASSWORD RESET FUNCTIONS

// Save OTP and expiry
export function savePasswordResetOtp(userId, otp, expiresAt) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetOtp: otp,
      passwordResetOtpExpiresAt: expiresAt,
    },
  });
}

// Update password
export function updatePassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: {passwordHash},
  });
}

// Clear OTP after successful reset
export function clearPasswordResetOtp(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetOtp: null,
      passwordResetOtpExpiresAt: null,
    },
  });
}

export function savePasswordResetToken(userId, token, expiresAt) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: token,
      passwordResetTokenExpiresAt: expiresAt,
      passwordResetOtp: null,
      passwordResetOtpExpiresAt: null, // OTP is now consumed, can't be reused
    },
  });
}

export function findUserByResetToken(hashedToken) {
  return prisma.user.findFirst({
    where: { passwordResetToken: hashedToken },
  });
}

export function clearPasswordResetToken(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordResetToken: null, passwordResetTokenExpiresAt: null },
  });
}
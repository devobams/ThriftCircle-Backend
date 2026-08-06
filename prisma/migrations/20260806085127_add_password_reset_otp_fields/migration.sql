-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordResetOtp" TEXT,
ADD COLUMN     "passwordResetOtpExpiresAt" TIMESTAMP(3);

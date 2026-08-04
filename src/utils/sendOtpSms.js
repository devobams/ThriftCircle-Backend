export async function sendOtpSms(phoneNumber, otp) {
  console.log(`
=====================================
PASSWORD RESET OTP
=====================================
Phone Number: ${phoneNumber}
OTP: ${otp}
=====================================
  `);

  return true;
}
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4, // force IPv4 for this connection
  auth: {
    user: env.gmailUser,
    pass: env.gmailAppPassword,
  },
});

export async function sendOtpEmail(email, otp) {
  try {
    await transporter.sendMail({
      from: `"ThriftCircle" <${env.gmailUser}>`,
      to: email,
      subject: "Your ThriftCircle Password Reset Code",
      text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });
  } catch (error) {
    console.error("Email send error:", error.message);
    const err = new Error("Failed to send OTP email");
    err.status = 500;
    throw err;
  }
}
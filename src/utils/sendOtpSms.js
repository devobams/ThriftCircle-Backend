import axios from "axios";
import { env } from "../config/env.js";

export async function sendOtpSms(phoneNumber, otp) {
  try {
    const response = await axios.post(
      `${env.termiiBaseUrl}/api/sms/number/send`,
      {
        api_key: env.termiiApiKey,
        to: phoneNumber,
        sms: `Your ThriftCircle password reset OTP is ${otp}. It expires in 10 minutes.`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Termii Error:", error.response?.data || error.message);

    const err = new Error("Failed to send OTP");
    err.status = 500;
    throw err;
  }
}
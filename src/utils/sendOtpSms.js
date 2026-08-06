import axios from "axios";
import { env } from "../config/env.js";
import { toInternationalFormat } from "./phoneNumber.js";

export async function sendOtpSms(phoneNumber, otp) {
  try {
    const baseUrl = env.termiiBaseUrl.replace(/\/+$/, "");
    const formattedPhone = toInternationalFormat(phoneNumber);

    const response = await axios.post(
      `${baseUrl}/api/sms/send`,
      {
        api_key: env.termiiApiKey,
        to: formattedPhone,
        from: env.termiiSenderId,
        sms: `Your ThriftCircle password reset OTP is ${otp}. It expires in 10 minutes.`,
        type: "plain",
        channel: "dnd",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
        maxRedirects: 0,
      }
    );

    console.log("Termii response:", response.data);

    if (response.data.code !== "ok") {
      throw new Error(`Termii rejected the send: ${JSON.stringify(response.data)}`);
    }

    return response.data;
  } catch (error) {
    console.error("Termii Error:", error.response?.data || error.message);
    const err = new Error("Failed to send OTP");
    err.status = 500;
    throw err;
  }
}
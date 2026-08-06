import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.jwtSecret);

    try {
      const isBlacklisted = await redis.get(`blacklist:${hashToken(token)}`);
      if (isBlacklisted) {
        return res.status(401).json({ message: "Token has been invalidated" });
      }
    } catch (redisErr) {
      // Redis unreachable — degrade gracefully, same pattern as forgotPassword.
      // Don't lock everyone out of the app because Redis had a bad moment.
      console.error("Redis blacklist check failed:", redisErr.message);
    }

    req.user = payload;
    req.token = token; // needed by the logout handler below
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
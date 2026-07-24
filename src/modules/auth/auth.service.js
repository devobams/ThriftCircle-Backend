import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  findUserByPhoneNumber,
  createUser,
  findUserById,
} from "./auth.model.js";

const SALT_ROUNDS = 10;

// --- DAY 1 STUB ---
// Dev 2 hasn't built real Invite/Group lookup yet (Sprint Guide, Day 1–2 table).
// This stands in for a real `invites.model.js` lookup until Dev 2 hands off
// the real thing on Day 5 (Sprint Guide, Day 5 checklist).
// TODO(Day 5): replace with a real lookup against the Invite table.
function resolveInviteStub(inviteCode) {
  return {
    groupId: "stub-group-id",
    groupName: "Stub Group (placeholder until Invite module is ready)",
    inviteValid: true,
  };
}

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


export async function registerUser(data) {
  const existing = await findUserByPhoneNumber(data.phone_number);
  if (existing) {
    const err = new Error("Phone number is already registered");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  
  let groupContext = null;
  if (data.intent === "member") {
    groupContext = resolveInviteStub(data.invite_code);
    if (!groupContext.inviteValid) {
      const err = new Error("Invalid or expired invite code");
      err.status = 400;
      throw err;
    }
  }

  const user = await createUser({
    fullName: data.full_name,
    phoneNumber: data.phone_number,
    email: data.email,
    passwordHash,
    role: data.intent,
  })

  const token = signToken(user);

  return {
    user: toSafeUser(user),
    token,
    group_context: groupContext,
  };
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
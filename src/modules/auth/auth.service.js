import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  findUserByPhoneNumber,
  createUser,
  findUserById,
} from "./auth.model.js";

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
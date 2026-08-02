import { asyncHandler } from "../../utils/asyncHandler.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import { registerUser, loginUser, getUserById } from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await loginUser(data);
  res.status(200).json(result);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  res.status(200).json({ user });
});
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getContributionSchedule } from "./contributions.service.js";

export const getSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const schedule = await getContributionSchedule(id);

  res.status(200).json(schedule);
});
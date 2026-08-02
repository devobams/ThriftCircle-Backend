import { asyncHandler } from "../../utils/asyncHandler.js";
import { getOrganizerDashboard } from "./organizerDashboard.service.js";

export const getOrganizerDashboardHandler = asyncHandler(async (req, res) => {
  const dashboard = await getOrganizerDashboard(req.user.id);
  res.status(200).json({ success: true, data: dashboard });
});
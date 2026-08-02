import { asyncHandler } from "../../utils/asyncHandler.js";
import { groupIdParamsSchema } from "./dashboard.validation.js";
import { getGroupDashboard, getMemberDashboard } from "./dashboard.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const { id } = groupIdParamsSchema.parse(req.params);

  const dashboard = await getGroupDashboard(id, req.user.id);

  res.status(200).json({
    success: true,
    data: dashboard,
  });
});

export const getMemberDashboardHandler = asyncHandler(async (req, res) => {
  const { id } = groupIdParamsSchema.parse(req.params);
  const dashboard = await getMemberDashboard(id, req.user.id);
  res.status(200).json({ success: true, data: dashboard });
});
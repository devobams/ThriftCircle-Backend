import { asyncHandler } from "../../utils/asyncHandler.js";
import { reportParamsSchema } from "./reports.validation.js";
import { getContributionReport } from "./reports.service.js";

export const getReport = asyncHandler(async (req, res) => {
  const { id, cycleId } = reportParamsSchema.parse(req.params);

  const report = await getContributionReport(id, cycleId);

  if (report.message) {
    return res.status(404).json(report);
  }

  return res.status(200).json({
    success: true,
    data: report,
  });
});
import { getAssignedGroups } from "../modules/back-office/backOffice.model.js";

export async function scopeToAssignedGroups(req, res, next) {
  if (req.user.role === "super_admin") return next();
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized for back-office access" });
  }
  const assignments = await getAssignedGroups(req.user.id);
  req.assignedGroupIds = assignments.map((a) => a.groupId);
  next();
}
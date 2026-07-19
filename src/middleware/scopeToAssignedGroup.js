// Full implementation depends on the admins.service.js module (not built yet).
// Stub for now — Module E owner fills this in per TRD v2 Section 7.2.
export async function scopeToAssignedGroups(req, res, next) {
  if (req.user.role === "super_admin") return next();
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized for back-office access" });
  }
  // TODO: fetch assigned group IDs and check req.params.groupId against them
  next();
}
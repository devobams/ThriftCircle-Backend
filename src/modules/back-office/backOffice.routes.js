import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { scopeToAssignedGroups } from "../../middleware/scopeToAssignedGroup.js";
import {
  handleCreateAdmin,
  handleListAdmins,
  handleDeactivateAdmin,
  handleUpdateAssignments,
  handleBackOfficeDashboard,
  handleAssignedGroups,
  handleAssignedDisputes,
  handleResolveDispute,
  handleAnalytics,
} from "./backOffice.controller.js";

const router = Router();

// SUPER ADMIN ROUTES
router.post(
  "/admins",
  authenticate,
  authorize("super_admin"),
  handleCreateAdmin,
);
router.get("/admins", authenticate, authorize("super_admin"), handleListAdmins);
router.patch(
  "/admins/:id/deactivate",
  authenticate,
  authorize("super_admin"),
  handleDeactivateAdmin,
);
router.patch(
  "/admins/:id/assignments",
  authenticate,
  authorize("super_admin"),
  handleUpdateAssignments,
);
router.get(
  "/analytics",
  authenticate,
  authorize("super_admin"),
  handleAnalytics,
);

// ADMIN ROUTES
router.get(
  "/groups",
  authenticate,
  scopeToAssignedGroups,
  handleAssignedGroups,
);
router.get(
  "/disputes",
  authenticate,
  scopeToAssignedGroups,
  handleAssignedDisputes,
);
router.patch(
  "/disputes/:id",
  authenticate,
  scopeToAssignedGroups,
  handleResolveDispute,
);
router.get(
  "/dashboard",
  authenticate,
  scopeToAssignedGroups,
  handleBackOfficeDashboard,
);
export default router;

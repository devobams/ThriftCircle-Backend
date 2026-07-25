import {Router} from "express";
import {authenticate} from "../../middleware/authenticate.js";
import {authorize} from "../../middleware/authorize.js";
import {scopeToAssignedGroups} from "../../middleware/scopeToAssignedGroup.js";

import {handleCreateAdmin,handleListAdmins,handleDeactivateAdmin,handleUpdateAssignments} from "./backOffice.controller.js";
import {handleAssignedGroups,handleAssignedDisputes } from "./backOffice.controller.js";
const router = Router();

// SUPER ADMIN ROUTES
router.post("/admins",authenticate,authorize("super_admin"),handleCreateAdmin);
router.get("/admins",authenticate,authorize("super_admin"),handleListAdmins);
router.patch("/admins/:id/deactivate",authenticate,authorize("super_admin"),handleDeactivateAdmin);
router.patch("/admins/:id/assignments",authenticate,authorize("super_admin"),handleUpdateAssignments);
router.get("/disputes",authenticate,authorize("admin"),scopeToAssignedGroups,handleAssignedDisputes);
// ADMIN ROUTES
router.get("/groups",authenticate,authorize("admin"),scopeToAssignedGroups,handleAssignedGroups);
router.get("/disputes",authenticate,authorize("admin"),scopeToAssignedGroups,handleAssignedDisputes);
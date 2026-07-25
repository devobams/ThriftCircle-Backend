import {Router} from "express";
import {authenticate} from "../../middleware/authenticate.js";
import {authorize} from "../../middleware/authorize.js";
import {scopeToAssignedGroups} from "../../middleware/scopeToAssignedGroup.js";
import {handleCreateAdmin,handleListAdmins,handleDeactivateAdmin,handleUpdateAssignments} from "./backOffice.controller.js";
import {handleAssignedGroups,handleAssignedDisputes,handleResolveDispute} from "./backOffice.controller.js";


const router = Router();

// SUPER ADMIN ROUTES
router.post("/admins",authenticate,authorize("super_admin"),handleCreateAdmin);
router.get("/admins",authenticate,authorize("super_admin"),handleListAdmins);
router.patch("/admins/:id/deactivate",authenticate,authorize("super_admin"),handleDeactivateAdmin);
router.patch("/admins/:id/assignments",authenticate,authorize("super_admin"),handleUpdateAssignments);


// ADMIN ROUTES
router.get("/groups",authenticate,authorize("admin"),scopeToAssignedGroups,handleAssignedGroups);
router.get("/disputes",authenticate,authorize("admin"),scopeToAssignedGroups,handleAssignedDisputes);
router.patch("/disputes/:id",authenticate,authorize("admin"),scopeToAssignedGroups,handleResolveDispute);
export default router;
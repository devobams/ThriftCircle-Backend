import {Router} from "express";
import {authenticate} from "../../middleware/authenticate.js";
import {authorize} from "../../middleware/authorize.js";
import {scopeToAssignedGroups} from "../../middleware/scopeToAssignedGroup.js";

import {handleCreateAdmin,handleListAdmins} from "./backOffice.controller.js";

const router = Router();

// SUPER ADMIN ROUTES
 router.post("/admins",authenticate,authorize("super_admin"),handleCreateAdmin);
 router.get("/admins",authenticate,authorize("super_admin"),handleListAdmins);
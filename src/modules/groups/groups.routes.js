import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  handleCreateGroup,
  handleGetGroupById,
  handleListMyGroups,
  handleListGroupMembers,
} from "./groups.controller.js";

const router = Router();

router.post("/groups", authenticate, authorize("organizer"), handleCreateGroup);
router.get("/groups/mine", authenticate, authorize("organizer"), handleListMyGroups);
router.get("/groups/:id/members", authenticate, handleListGroupMembers);
router.get("/groups/:id", authenticate, handleGetGroupById);

export default router;
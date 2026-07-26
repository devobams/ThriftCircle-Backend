import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  handleCreateGroup,
  handleGetGroupById,
  handleJoinGroup,
} from "./groups.controller.js";

const router = Router();

router.post("/groups", authenticate, authorize("organizer"), handleCreateGroup);
router.get("/groups/:id", authenticate, handleGetGroupById);
router.post("/groups/:id/join", authenticate, handleJoinGroup);

export default router;

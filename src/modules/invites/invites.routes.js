import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  handleCreateInvite,
  handleRegenerateInvite,
  handleDisableInvite,
  handleGetInvitePreview,
} from "./invites.controller.js";

const router = Router();

router.post("/groups/:id/invites", authenticate, authorize("organizer"), handleCreateInvite);
router.patch("/groups/:id/invites/regenerate", authenticate, authorize("organizer"), handleRegenerateInvite);
router.patch("/groups/:id/invites/disable", authenticate, authorize("organizer"), handleDisableInvite);
router.get("/invites/:code", handleGetInvitePreview);

export default router;

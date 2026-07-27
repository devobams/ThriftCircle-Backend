
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import {
  handleCreateJoinRequest,
  handleListPendingJoinRequests,
  handleApproveJoinRequest,
  handleRejectJoinRequest,
  handleGetAvailableSlots,
  handleSelectPosition,
} from "./join-requests.controller.js";

const router = Router();

router.post("/groups/:id/join-requests", authenticate, handleCreateJoinRequest);
router.get("/groups/:id/join-requests", authenticate, authorize("organizer"), handleListPendingJoinRequests);
router.patch("/join-requests/:id/approve", authenticate, authorize("organizer"), handleApproveJoinRequest);
router.patch("/join-requests/:id/reject", authenticate, authorize("organizer"), handleRejectJoinRequest);
router.get("/groups/:id/available-slots", authenticate, handleGetAvailableSlots);
router.post("/join-requests/:id/select-position", authenticate, handleSelectPosition);

export default router;

import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getSchedule,
  submitContributionPayment,
  confirmContributionPayment,
  rejectContributionPayment,
} from "./contributions.controller.js";

const router = Router();

/**
 * Returns the contribution schedule for a group.
 */
router.get("/groups/:id/schedule", authenticate, getSchedule);

/**
 * Member submits proof of payment.
 */
router.post("/contributions/:id/pay", authenticate, submitContributionPayment);

/**
 * Organizer confirms a submitted payment.
 */
router.patch("/contributions/:id/confirm", authenticate, authorize("organizer"), confirmContributionPayment);

/**
 * Organizer rejects a submitted payment.
 */
router.patch("/contributions/:id/reject", authenticate, authorize("organizer"), rejectContributionPayment);

export default router;
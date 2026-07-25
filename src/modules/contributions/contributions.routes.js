import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";

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
router.get("/groups/:id/schedule",authenticate,getSchedule);

/**
 * Member submits proof of payment.
 */
router.post("/:id/pay",authenticate,submitContributionPayment);

/**
 * Organizer confirms a submitted payment.
 */
router.patch("/:id/confirm",authenticate,confirmContributionPayment);

/**
 * Organizer rejects a submitted payment.
 */
router.patch("/:id/reject",authenticate,rejectContributionPayment);

export default router;
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getSchedule,
  submitContributionPayment,
  confirmContributionPayment,
  rejectContributionPayment,
  startGroupRotation,
  getContributionById,
  getContributionsByCycle,
  getMyContributionHistory
} from "./contributions.controller.js";

import { uploadSingleFile } from "../../middleware/uploadMiddleware.js"; // add import


const router = Router();

/**
 * Returns the contribution schedule for a group.
 */
router.get("/groups/:id/schedule", authenticate, getSchedule);

/**
 * Returns the contribution history for a user.
 */
router.get("/contributions/me", authenticate, getMyContributionHistory);

/**
 * Member submits proof of payment.
 */
router.post(
  "/contributions/:id/pay",
  authenticate,
  uploadSingleFile, // NEW — runs before the controller, populates req.file
  submitContributionPayment
);

/**
 * Organizer confirms a submitted payment.
 */
router.patch("/contributions/:id/confirm", authenticate, authorize("organizer"), confirmContributionPayment);

/**
 * Organizer rejects a submitted payment.
 */
router.patch("/contributions/:id/reject", authenticate, authorize("organizer"), rejectContributionPayment);

/**
 * Organizer starts a group rotation.
 */
router.post("/groups/:id/start-rotation", authenticate, authorize("organizer"), startGroupRotation);

/**
 * Get Contribution payment detail and status
 */

router.get("/contributions/:id", authenticate, getContributionById);

// Get contributions for a specific cycle
router.get("/groups/:id/cycles/:cycleId/contributions", authenticate, getContributionsByCycle);

export default router;
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getGroupPayoutOrder,
  getGroupPayouts,
  recordGroupPayout,
  updateGroupPayoutStatus,
} from "./payouts.controller.js";

const router = Router();

router.get("/groups/:id/payout-order", authenticate, getGroupPayoutOrder);
router.get("/groups/:id/payouts", authenticate, getGroupPayouts);
router.post("/payout-order/:id/payouts", authenticate, authorize("organizer"), recordGroupPayout);
router.patch("/payouts/:id", authenticate, authorize("organizer"), updateGroupPayoutStatus);

export default router;
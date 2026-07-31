import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  handleRaiseDispute,
  handleGetDispute,
  handleListGroupDisputes,
} from "./disputes.controller.js";

const router = Router();

router.post("/groups/:id/disputes", authenticate, handleRaiseDispute);
router.get("/disputes/:id", authenticate, handleGetDispute);
router.get("/groups/:id/disputes", authenticate, handleListGroupDisputes);

export default router;
import { Router } from "express";
import {authenticate} from "../../middleware/authenticate.js";
import { getSchedule} from "./contributions.controller.js";

const router = Router();

router.get("/groups/:id/schedule", authenticate, getSchedule);

export default router;
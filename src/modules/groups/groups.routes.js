
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { handleCreateGroup, handleGetGroupById } from "./groups.controller.js";

const router = Router();

router.post("/groups", authenticate, handleCreateGroup);
router.get("/groups/:id", authenticate, handleGetGroupById);

export default router;

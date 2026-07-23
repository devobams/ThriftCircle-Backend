import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import contributionRoutes from "./modules/contributions/contributions.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/contributions", contributionRoutes);
// as modules get built, register them here, e.g.:
// app.use("/api/v1/groups", groupsRoutes);
// app.use("/api/v1/back-office/admins", adminRoutes);

app.use(errorHandler);

export default app;
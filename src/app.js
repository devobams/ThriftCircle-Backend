import express from "express";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", routes);
// Each module's routes get added inside src/routes/index.js, not here —
// keeps this file untouched as new modules come online (see CONTRIBUTING.md)

app.use(errorHandler);

export default app;
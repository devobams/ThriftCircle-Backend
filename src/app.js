import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = [
  "http://127.0.0.1:5500",
  // add each teammate's confirmed origin here as they share it
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman, curl, server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
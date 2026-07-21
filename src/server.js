import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

async function start() {
  try {
    await prisma.$queryRaw`SELECT 1`; // fail fast if DB is unreachable
    app.listen(env.port, () => {
      console.log(`ThriftCircle backend running on port ${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
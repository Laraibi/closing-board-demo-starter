import express from "express";
import { createStore } from "./lib/store.js";
import { withRole } from "./lib/auth.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { quizRoutes } from "./routes/quizzes.js";
import { attemptRoutes } from "./routes/attempts.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { adminRoutes } from "./routes/admin.js";

export function createApp(store = createStore()) {
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.use(withRole);
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/quizzes", quizRoutes(store));
  app.use("/api/attempts", attemptRoutes(store));
  app.use("/api/feedback", feedbackRoutes(store));
  app.use("/api/admin", adminRoutes(store));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

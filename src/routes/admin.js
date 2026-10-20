import { Router } from "express";
import { invalid } from "../lib/errors.js";
import { requireRole } from "../lib/auth.js";
import { runDigest } from "../jobs/digest.js";

const cronPattern = /^(\S+\s+){4}\S+$/;

export function adminRoutes(store) {
  const router = Router();
  router.use(requireRole("admin"));

  router.get("/settings", (_req, res) => res.json({ settings: store.settings }));

  router.patch("/settings", (req, res, next) => {
    const patch = {};
    if ("emailsEnabled" in (req.body || {})) patch.emailsEnabled = Boolean(req.body.emailsEnabled);
    if ("digestCron" in (req.body || {})) {
      if (!cronPattern.test(String(req.body.digestCron))) return next(invalid([{ field: "digestCron", message: "Expression cron à 5 champs." }]));
      patch.digestCron = String(req.body.digestCron);
    }
    Object.assign(store.settings, patch);
    res.json({ settings: store.settings });
  });

  // Déclenchement manuel du job planifié.
  router.post("/jobs/digest", (_req, res) => res.json(runDigest(store)));

  router.get("/stats", (_req, res) => {
    const scores = store.attempts.map((attempt) => attempt.score);
    res.json({
      quizzes: store.quizzes.length,
      attempts: store.attempts.length,
      averageScore: scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0,
      byModule: Object.fromEntries([...new Set(store.quizzes.map((quiz) => quiz.module))].map((module) => [module, store.quizzes.filter((quiz) => quiz.module === module).length]))
    });
  });

  return router;
}

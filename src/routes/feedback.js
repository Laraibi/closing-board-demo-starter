import { Router } from "express";
import { forbidden, invalid, notFound } from "../lib/errors.js";
import { newId } from "../lib/store.js";
import { requireRole } from "../lib/auth.js";
import { sendMail } from "../lib/mailer.js";

export function feedbackRoutes(store) {
  const router = Router();

  router.post("/", requireRole("trainer", "admin"), (req, res, next) => {
    const attempt = store.attempts.find((item) => item.id === req.body?.attemptId);
    if (!attempt) return next(notFound("Tentative"));
    const text = String(req.body?.text || "").trim();
    if (text.length < 5) return next(invalid([{ field: "text", message: "5 caractères minimum." }]));
    const entry = { id: newId("fb"), attemptId: attempt.id, userId: attempt.userId, text, at: new Date().toISOString() };
    store.feedback.push(entry);
    const user = store.users.find((item) => item.id === attempt.userId);
    if (user) sendMail(store, { to: user.email, template: "feedbackPosted", data: { name: user.name } });
    res.status(201).json({ feedback: entry });
  });

  // Un apprenant ne lit que ses propres feedbacks.
  router.get("/user/:userId", (req, res, next) => {
    if (req.role === "learner" && req.userId !== req.params.userId) return next(forbidden());
    res.json({ feedback: store.feedback.filter((item) => item.userId === req.params.userId) });
  });

  return router;
}

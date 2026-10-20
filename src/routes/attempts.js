import { Router } from "express";
import { invalid, notFound } from "../lib/errors.js";
import { newId } from "../lib/store.js";
import { sendMail } from "../lib/mailer.js";

export const maxAttempts = 3;

/** Score en pourcentage, arrondi. Une réponse absente compte comme fausse. */
export function score(quiz, answers) {
  const good = quiz.questions.filter((question) => answers?.[question.id] === question.answer).length;
  return Math.round((good * 100) / quiz.questions.length);
}

/** Progression d'un apprenant sur un module : meilleur score par quiz, puis moyenne. */
export function progression(store, userId, module) {
  const quizzes = store.quizzes.filter((quiz) => !module || quiz.module === module);
  if (!quizzes.length) return { average: 0, done: 0, total: 0 };
  const best = quizzes.map((quiz) => Math.max(0, ...store.attempts.filter((a) => a.quizId === quiz.id && a.userId === userId).map((a) => a.score)));
  return { average: Math.round(best.reduce((sum, value) => sum + value, 0) / quizzes.length), done: best.filter((value) => value > 0).length, total: quizzes.length };
}

export function attemptRoutes(store) {
  const router = Router();

  router.post("/", (req, res, next) => {
    const quiz = store.quizzes.find((item) => item.id === req.body?.quizId);
    if (!quiz) return next(notFound("Quiz"));
    if (!req.userId) return next(invalid([{ field: "x-user", message: "Utilisateur requis." }]));
    const previous = store.attempts.filter((a) => a.quizId === quiz.id && a.userId === req.userId).length;
    if (previous >= maxAttempts) return next(invalid([{ field: "quizId", message: `${maxAttempts} tentatives maximum.` }]));
    const attempt = { id: newId("att"), quizId: quiz.id, userId: req.userId, score: score(quiz, req.body.answers), at: new Date().toISOString() };
    store.attempts.push(attempt);
    const user = store.users.find((item) => item.id === req.userId);
    if (user) sendMail(store, { to: user.email, template: "attemptScored", data: { name: user.name, score: attempt.score } });
    res.status(201).json({ attempt, remaining: maxAttempts - previous - 1 });
  });

  router.get("/progression/:userId", (req, res) => {
    res.json(progression(store, req.params.userId, req.query.module));
  });

  return router;
}

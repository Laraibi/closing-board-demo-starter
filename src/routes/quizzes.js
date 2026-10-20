import { Router } from "express";
import { invalid, notFound } from "../lib/errors.js";
import { newId } from "../lib/store.js";
import { requireRole } from "../lib/auth.js";

// Un apprenant ne voit jamais les bonnes réponses : elles restent côté serveur.
export function publicQuiz(quiz) {
  return {
    id: quiz.id,
    title: quiz.title,
    module: quiz.module,
    questions: quiz.questions.map(({ id, text, choices }) => ({ id, text, choices }))
  };
}

export function quizProblems(body) {
  const problems = [];
  if (!body?.title || String(body.title).trim().length < 3) problems.push({ field: "title", message: "3 caractères minimum." });
  if (!Array.isArray(body?.questions) || !body.questions.length) problems.push({ field: "questions", message: "Au moins une question." });
  for (const [index, question] of (body?.questions || []).entries()) {
    if (!Array.isArray(question.choices) || question.choices.length < 2) problems.push({ field: `questions.${index}.choices`, message: "Deux choix minimum." });
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= (question.choices || []).length) {
      problems.push({ field: `questions.${index}.answer`, message: "Index de bonne réponse invalide." });
    }
  }
  return problems;
}

export function quizRoutes(store) {
  const router = Router();

  router.get("/", (req, res) => {
    const list = store.quizzes.filter((quiz) => !req.query.module || quiz.module === req.query.module);
    res.json({ quizzes: req.role === "learner" ? list.map(publicQuiz) : list });
  });

  router.get("/:id", (req, res, next) => {
    const quiz = store.quizzes.find((item) => item.id === req.params.id);
    if (!quiz) return next(notFound("Quiz"));
    res.json({ quiz: req.role === "learner" ? publicQuiz(quiz) : quiz });
  });

  router.post("/", requireRole("trainer", "admin"), (req, res, next) => {
    const problems = quizProblems(req.body);
    if (problems.length) return next(invalid(problems));
    const quiz = {
      id: newId("quiz"),
      title: String(req.body.title).trim(),
      module: String(req.body.module || "general"),
      questions: req.body.questions.map((question) => ({ id: newId("q"), text: question.text, choices: question.choices, answer: question.answer }))
    };
    store.quizzes.push(quiz);
    res.status(201).json({ quiz });
  });

  return router;
}

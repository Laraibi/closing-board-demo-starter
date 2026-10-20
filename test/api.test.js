import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createApp } from "../src/app.js";
import { createStore } from "../src/lib/store.js";
import { demoData } from "../scripts/seed.js";

let server;
let base;
let store;

before(async () => {
  store = createStore(demoData());
  server = createApp(store).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const call = (path, { role = "learner", user = "", method = "GET", body } = {}) => fetch(`${base}${path}`, {
  method,
  headers: { "content-type": "application/json", "x-role": role, "x-user": user },
  body: body ? JSON.stringify(body) : undefined
}).then(async (res) => ({ status: res.status, data: await res.json() }));

describe("quiz", () => {
  test("un apprenant ne voit pas les bonnes réponses", async () => {
    const { data } = await call("/api/quizzes/quiz_http");
    assert.equal("answer" in data.quiz.questions[0], false);
  });

  test("un formateur crée un quiz ; données invalides → 400 au format commun", async () => {
    const bad = await call("/api/quizzes", { role: "trainer", method: "POST", body: { title: "x", questions: [] } });
    assert.equal(bad.status, 400);
    assert.equal(bad.data.error.code, "VALIDATION_ERROR");
    const ok = await call("/api/quizzes", { role: "trainer", method: "POST", body: { title: "REST", module: "backend", questions: [{ text: "?", choices: ["a", "b"], answer: 0 }] } });
    assert.equal(ok.status, 201);
  });

  test("un apprenant ne crée pas de quiz", async () => {
    const res = await call("/api/quizzes", { method: "POST", body: {} });
    assert.equal(res.status, 403);
  });
});

describe("tentatives et progression", () => {
  test("score, e-mail et limite de trois tentatives", async () => {
    const answers = { q_1: 1, q_2: 0 };
    const first = await call("/api/attempts", { user: "u_ada", method: "POST", body: { quizId: "quiz_http", answers } });
    assert.equal(first.data.attempt.score, 50);
    assert.equal(store.outbox.at(-1).to, "ada@example.com");
    await call("/api/attempts", { user: "u_ada", method: "POST", body: { quizId: "quiz_http", answers: { q_1: 1, q_2: 1 } } });
    await call("/api/attempts", { user: "u_ada", method: "POST", body: { quizId: "quiz_http", answers } });
    const fourth = await call("/api/attempts", { user: "u_ada", method: "POST", body: { quizId: "quiz_http", answers } });
    assert.equal(fourth.status, 400);
    const progress = await call("/api/attempts/progression/u_ada?module=backend");
    assert.equal(progress.data.done, 1);
  });
});

describe("feedback et droits", () => {
  test("un apprenant ne lit que ses propres feedbacks", async () => {
    const attempt = store.attempts[0];
    const posted = await call("/api/feedback", { role: "trainer", method: "POST", body: { attemptId: attempt.id, text: "Revoir les verbes idempotents." } });
    assert.equal(posted.status, 201);
    assert.equal((await call("/api/feedback/user/u_ada", { user: "u_bob" })).status, 403);
    assert.equal((await call("/api/feedback/user/u_ada", { user: "u_ada" })).data.feedback.length, 1);
  });
});

describe("administration", () => {
  test("réglages, cron validé, job manuel et statistiques", async () => {
    assert.equal((await call("/api/admin/settings")).status, 403);
    const bad = await call("/api/admin/settings", { role: "admin", method: "PATCH", body: { digestCron: "tous les jours" } });
    assert.equal(bad.status, 400);
    const ok = await call("/api/admin/settings", { role: "admin", method: "PATCH", body: { digestCron: "30 17 * * *", emailsEnabled: false } });
    assert.equal(ok.data.settings.digestCron, "30 17 * * *");
    const digest = await call("/api/admin/jobs/digest", { role: "admin", method: "POST" });
    assert.ok(digest.data.attempts >= 1);
    const stats = await call("/api/admin/stats", { role: "admin" });
    assert.equal(stats.data.byModule.backend, 2);
  });

  test("route inconnue et JSON illisible : erreurs JSON cohérentes", async () => {
    assert.equal((await call("/api/nope")).data.error.code, "ROUTE_NOT_FOUND");
    const res = await fetch(`${base}/api/quizzes`, { method: "POST", headers: { "content-type": "application/json", "x-role": "trainer" }, body: "{oops" });
    assert.equal((await res.json()).error.code, "BAD_JSON");
  });
});

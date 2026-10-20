// Données de démonstration, entièrement fictives.
export function demoData() {
  return {
    users: [
      { id: "u_ada", name: "Ada Démo", email: "ada@example.com", role: "learner" },
      { id: "u_bob", name: "Bob Démo", email: "bob@example.com", role: "learner" },
      { id: "u_trainer", name: "Formatrice Démo", email: "formatrice@example.com", role: "trainer" }
    ],
    quizzes: [
      {
        id: "quiz_http",
        title: "Bases HTTP",
        module: "backend",
        questions: [
          { id: "q_1", text: "Code d'une création réussie ?", choices: ["200", "201", "204"], answer: 1 },
          { id: "q_2", text: "Verbe idempotent ?", choices: ["POST", "PUT"], answer: 1 }
        ]
      }
    ]
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(demoData(), null, 2));
}

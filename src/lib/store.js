// Stockage en mémoire : suffisant pour la démo et les tests, remplaçable par MongoDB.
export function createStore(seed = {}) {
  return {
    users: [...(seed.users || [])],
    quizzes: [...(seed.quizzes || [])],
    attempts: [...(seed.attempts || [])],
    feedback: [...(seed.feedback || [])],
    settings: { digestCron: "0 18 * * *", emailsEnabled: true, ...(seed.settings || {}) },
    outbox: []
  };
}

let next = 1;
export const newId = (prefix) => `${prefix}_${next++}`;

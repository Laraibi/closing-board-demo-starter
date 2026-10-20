// Résumé quotidien pour le formateur : tentatives des dernières 24 h.
export function runDigest(store, now = new Date()) {
  const since = now.getTime() - 24 * 60 * 60 * 1000;
  const recent = store.attempts.filter((attempt) => new Date(attempt.at).getTime() >= since);
  return { at: now.toISOString(), attempts: recent.length, average: recent.length ? Math.round(recent.reduce((sum, a) => sum + a.score, 0) / recent.length) : 0 };
}

// Planification minimale sans dépendance : vérifie chaque minute l'heure du cron "m h * * *".
export function scheduleDigest(store, log = console.log) {
  return setInterval(() => {
    const [minute, hour] = store.settings.digestCron.split(/\s+/);
    const now = new Date();
    if (String(now.getMinutes()) === minute && String(now.getHours()) === hour) log("[digest]", runDigest(store, now));
  }, 60 * 1000);
}

// Gabarits d'e-mails configurables : {{name}} et {{score}} sont remplacés.
export const templates = {
  attemptScored: { subject: "Votre tentative est notée", body: "Bonjour {{name}}, votre score est de {{score}} %." },
  feedbackPosted: { subject: "Nouveau feedback", body: "Bonjour {{name}}, votre formateur a laissé un feedback." }
};

export function render(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, key) => String(data[key] ?? ""));
}

export function sendMail(store, { to, template, data }) {
  if (!store.settings.emailsEnabled) return { sent: false, reason: "disabled" };
  const chosen = templates[template];
  if (!chosen) return { sent: false, reason: "unknown-template" };
  store.outbox.push({ to, subject: render(chosen.subject, data), body: render(chosen.body, data), at: new Date().toISOString() });
  return { sent: true };
}

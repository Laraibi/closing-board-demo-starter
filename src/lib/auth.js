import { forbidden } from "./errors.js";

// Démo : le rôle vient de l'en-tête x-role (learner | trainer | admin).
export function withRole(req, _res, next) {
  req.role = String(req.get("x-role") || "learner");
  req.userId = String(req.get("x-user") || "");
  next();
}

export const requireRole = (...roles) => (req, _res, next) => (roles.includes(req.role) ? next() : next(forbidden()));

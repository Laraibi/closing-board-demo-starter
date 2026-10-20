# closing-board-demo-starter

API de démonstration d'un petit LMS (quiz, tentatives, feedback, administration), utilisée pour la **démo du Closing Board**. Toutes les données sont fictives.

## Lancer

```bash
cp .env.example .env
npm install
npm start          # http://localhost:3000/api/health
npm test           # tests node:test
```

## Routes principales

| Méthode | Route | Rôle | Rôle de la route |
|---|---|---|---|
| GET | `/api/quizzes` | tous | quiz, sans les bonnes réponses pour un apprenant |
| POST | `/api/quizzes` | formateur | créer un quiz (validation, erreurs JSON) |
| POST | `/api/attempts` | apprenant | tentative notée, 3 au plus, e-mail de score |
| GET | `/api/attempts/progression/:userId` | tous | meilleur score par quiz, moyenne |
| POST | `/api/feedback` | formateur | feedback sur une tentative, e-mail |
| GET/PATCH | `/api/admin/settings` | admin | e-mails, cron du résumé quotidien |
| POST | `/api/admin/jobs/digest` | admin | lancer le résumé à la main |
| GET | `/api/admin/stats` | admin | statistiques pour un tableau de bord React |

Le rôle passe par l'en-tête `x-role` (`learner`, `trainer`, `admin`) et l'utilisateur par `x-user` : c'est une démo, pas une authentification.

## Erreurs

Toutes les erreurs ont la même forme : `{ "error": { "code", "message", "details?" } }`.

## Documentation

- OpenAPI : à écrire.

## À faire

- Image Docker et collection Postman.
- Persistance MongoDB (le stockage est en mémoire).
- Préférences du résumé par formateur.
- Authentification réelle (JWT).

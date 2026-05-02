# Child Tasks

Application de suivi des tâches et récompenses pour Agathe et Maxence.

## Stack

React 19 · TanStack Start · Prisma · SQLite · Tailwind CSS · Shadcn UI

## Prérequis

- Node.js 20+
- npm

## Installation

```bash
npm install
cp .env.local.example .env.local
# Éditer .env.local avec les valeurs correctes
npm run db:push
npm run db:generate
```

## Lancer le projet

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Générer le mot de passe parent

```bash
./scripts/generate-parent-password.sh "mon_mot_de_passe"
```

Copier la ligne `PARENT_PASSWORD_HASH=...` dans `.env.local`.

> Les `$` du hash bcrypt doivent être échappés en `\$` dans `.env.local` — le script le fait automatiquement.

## Réinitialiser la base de données

Si tu veux repartir de zéro (pendant le développement) :

```bash
rm dev.db
npm run db:push
```

Optionnel : si un fichier seed existe, tu peux aussi faire :

```bash
npm run db:seed
```

## Scripts

| Commande              | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Développement (port 3000)                |
| `npm run build`       | Build production                         |
| `npm run preview`     | Prévisualiser le build                   |
| `npm run test`        | Lancer les tests (Vitest)                |
| `npm run lint`        | Vérifier le code (ESLint)                |
| `npm run format`      | Formater le code (Prettier + ESLint fix) |
| `npm run check`       | Vérifier le formatage                    |
| `npm run db:push`     | Appliquer le schéma Prisma               |
| `npm run db:migrate`  | Créer une migration                      |
| `npm run db:generate` | Générer le client Prisma                 |
| `npm run db:studio`   | Ouvrir Prisma Studio (GUI DB)            |

## Documentation

Voir [`docs/index.md`](docs/index.md) pour la documentation complète du code.

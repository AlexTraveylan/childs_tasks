# Index — Child Tasks

Application de suivi des tâches et récompenses pour enfants (Agathe & Maxence).

## Stack technique

- **React 19** + **TanStack Start** (SSR/fullstack) + **TanStack Router** (file-based routing)
- **Prisma 7** + **SQLite** (better-sqlite3)
- **Zustand** — state client (persisté localStorage)
- **Tailwind CSS 4** + **Shadcn UI** (composants)
- **bcryptjs** — hash mot de passe parent
- **Vitest** — tests unitaires

## Features

| Feature             | Doc                            | Route          | Server functions                                    |
| ------------------- | ------------------------------ | -------------- | --------------------------------------------------- |
| Tâches quotidiennes | [tasks.md](tasks.md)           | `/`            | `src/server/sessions.ts`                            |
| Récompenses         | [rewards.md](rewards.md)       | `/recompenses` | `src/server/purchases.ts`                           |
| Dashboard parent    | [parents.md](parents.md)       | `/parents`     | `src/server/sessions.ts`, `src/server/purchases.ts` |
| Système de config   | [config.md](config.md)         | —              | `src/server/config.ts`                              |
| Auth parent         | [auth.md](auth.md)             | —              | `src/server/auth.ts`                                |
| Utilitaires date    | [date-utils.md](date-utils.md) | —              | `src/lib/date.ts`                                   |

## Où trouver quoi

| Quoi                  | Où                                              |
| --------------------- | ----------------------------------------------- |
| Routes (pages)        | `src/routes/`                                   |
| Server functions      | `src/server/`                                   |
| Composants UI custom  | `src/components/`                               |
| Composants Shadcn     | `src/components/ui/`                            |
| State Zustand         | `src/store/taskStore.ts`                        |
| Types config          | `src/lib/config.ts`                             |
| Utils date (Paris TZ) | `src/lib/date.ts`                               |
| Config tâches JSON    | `config/matin\|soir/<jour>/<enfant>/tasks.json` |
| Config récompenses    | `config/rewards.json`                           |
| Schéma DB             | `prisma/schema.prisma`                          |

## Modèles Prisma

- **Child** — enfant (id, name, points)
- **TaskSession** — session tâches du jour (childId, date, period, day, completions JSON, pointsEarned, validated)
- **Purchase** — achat récompense (childId, rewardKey, cost, quantity, isDone)

## Enfants configurés

`agathe` et `maxence` — définis dans `config/` et synchronisés en DB via `validateAndSyncConfig`.

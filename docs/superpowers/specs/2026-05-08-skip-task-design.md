# Design — Skip tâche par le parent

**Date:** 2026-05-08

## Contexte

L'application Child Tasks permet aux enfants (Agathe & Maxence) de cocher leurs tâches quotidiennes. Un parent peut valider la session avec son mot de passe. On ajoute la possibilité pour un parent de **skipper** une tâche individuelle (ex: tâche non applicable ce jour) via un appui long sur l'item.

## Comportement

- Appui long (600ms) sur une tâche → modale mot de passe parent
- Si mot de passe correct → la tâche est skippée : cachée de la liste, persistée en DB
- Les tâches skippées **ne rapportent pas de points**
- Mais elles **n'empêchent pas le bonus de série complète** (5 pts) : si toutes les tâches non-skippées sont cochées dans les temps, le bonus s'applique
- Le skip persiste dans la session (survit au rechargement)

## Data

Nouvelle colonne `skips` (String, nullable, default `"[]"`) sur le modèle `TaskSession` :

```prisma
skips String? @default("[]")
```

Structure JSON : `{ "0": { "skippedAt": "2026-05-08T07:30:00.000Z" }, ... }` (clé = taskIndex)

## Logique de points (validateSession)

```
activeTasks = tasks.filter(index => !skipped[index])
pointsEarned = activeTasks.filter(t => completedInTime).length
allDoneInTime = activeTasks.every(t => completedInTime)
bonus = allDoneInTime ? 5 : 0
total = pointsEarned + bonus
```

## Server functions (src/server/sessions.ts)

- `skipTask({ sessionId, taskIndex, password })` — vérifie le mot de passe via `verifyParentPassword`, puis ajoute l'index dans le JSON `skips`
- `validateSession` — modifié pour exclure les skips du calcul de points

## State client (src/store/taskStore.ts)

Ajout de `skips: Record<string, Record<number, { skippedAt: string }>>` (même pattern que `completions`), avec `setSkip(childName, taskIndex)` et `removeSkip`.

## Composants

### TaskItem.tsx

- Écoute `onPointerDown` → timer 600ms → si tenu, ouvre modale
- Modale inline (ou Dialog Shadcn) avec champ mot de passe
- Callback `onSkip()` si succès
- Annule le timer sur `onPointerUp` / `onPointerLeave`

### ChildPanel.tsx

- Filtre les tâches skippées avant rendu (`tasks.filter((_, i) => !skips[i])`)
- Passe `onSkip` à chaque `TaskItem`

### src/routes/index.tsx

- Charge les skips depuis la session au démarrage
- Passe `onSkip` handler qui appelle `skipTask()` et met à jour le store

## Fichiers modifiés

| Fichier                         | Changement                                |
| ------------------------------- | ----------------------------------------- |
| `prisma/schema.prisma`          | Ajout colonne `skips`                     |
| `src/server/sessions.ts`        | `skipTask()` + modifier `validateSession` |
| `src/store/taskStore.ts`        | Ajout `skips` state                       |
| `src/components/TaskItem.tsx`   | Long press + modale mot de passe          |
| `src/components/ChildPanel.tsx` | Filtrage tâches skippées                  |
| `src/routes/index.tsx`          | Chargement skips + handler `onSkip`       |

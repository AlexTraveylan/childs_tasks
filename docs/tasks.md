# Feature : Tâches quotidiennes

## Route

`/` — `src/routes/index.tsx`

## Composants

- `src/components/ChildPanel.tsx` — panneau d'un enfant (liste tâches + progression + validation parent)
- `src/components/TaskItem.tsx` — une tâche avec checkbox et indicateur de deadline

## Server functions (`src/server/sessions.ts`)

- `getOrCreateSession({ childId, date, period, day })` — crée ou récupère la session du jour
- `updateSessionCompletions({ sessionId, completions })` — sauvegarde les coches en JSON
- `getPendingSessions()` — sessions non validées avec leurs completions parsées
- `validateSession({ sessionId, honest, tasks })` — valide la session et calcule les points

## State client (`src/store/taskStore.ts`)

Zustand persisté en localStorage (`chores-task-store`) :

- `completions` — `{ childName: { taskIndex: { completedAt: ISO } } }`
- `validated` — enfants dont la session est validée
- `resetIfStale()` — reset auto si date ou période a changé

## Config tâches

`config/matin|soir/<jour>/<enfant>/tasks.json`

```json
[{ "label": "Ranger son cartable", "deadline": "19:30" }]
```

Les deadlines sont en heure Europe/Paris.

## Logique de points

Calculé dans `validateSession` :

- **1 point** par tâche complétée dans les temps
- **+3 points bonus** si TOUTES les tâches sont dans les temps
- **0 point** si le parent marque "malhonnête"

## Périodes

Détectées automatiquement selon l'heure Paris via `src/lib/date.ts` :

- **matin** : 6h–14h
- **soir** : 14h–minuit

## Flux complet

1. `validateAndSyncConfig()` au démarrage — vérifie la config et sync les enfants en DB
2. `getOrCreateSession()` — crée la session si elle n'existe pas
3. L'enfant coche ses tâches → `updateSessionCompletions()` à chaque coche
4. Le parent entre son mot de passe → `verifyParentPassword()` → `validateSession()`

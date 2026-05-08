# Feature : Tâches quotidiennes

## Route

`/` — `src/routes/index.tsx`

## Composants

- `src/components/ChildPanel.tsx` — panneau d'un enfant (liste tâches + progression + validation parent)
- `src/components/TaskItem.tsx` — une tâche avec checkbox et indicateur de deadline

## Server functions (`src/server/sessions.ts`)

- `getOrCreateSession({ childId, date, period, day })` — crée ou récupère la session du jour
- `updateSessionCompletions({ sessionId, completions })` — sauvegarde les coches en JSON
- `skipTask({ sessionId, taskIndex, password })` — vérifie le mot de passe parent et persiste le skip
- `getPendingSessions()` — sessions non validées avec leurs completions et skips parsés
- `validateSession({ sessionId, honest, tasks })` — valide la session et calcule les points

## State client (`src/store/taskStore.ts`)

Zustand persisté en localStorage (`chores-task-store`) :

- `completions` — `{ childName: { taskIndex: { completedAt: ISO } } }`
- `skips` — `{ childName: { taskIndex: { skippedAt: ISO } } }`
- `validated` — enfants dont la session est validée
- `resetIfStale()` — reset auto si date ou période a changé

## Config tâches

`config/matin|soir/<jour>/<enfant>/tasks.json`

```json
[{ "label": "Ranger son cartable", "deadline": "19:30" }]
```

Les deadlines sont en heure Europe/Paris.

## Logique de points

Calculé dans `validateSession` via `calculatePoints(tasks, completions, skippedIndices)` :

- **1 point** par tâche active (non-skippée) complétée dans les temps
- **+5 points bonus** si TOUTES les tâches actives sont complétées dans les temps
- **0 point** si le parent marque "malhonnête"
- Les tâches skippées sont ignorées du calcul mais ne bloquent pas le bonus

## Skip de tâche (parent)

Un parent peut skipper une tâche en faisant un **appui long (600ms)** dessus. Un Dialog s'ouvre demandant le mot de passe parent.

- La tâche skippée est **cachée** de la liste
- Elle **ne rapporte pas de points**
- Elle **n'empêche pas le bonus** : si toutes les tâches non-skippées sont cochées dans les temps, le bonus de 5 points s'applique
- Le skip est persisté en DB (colonne `skips` JSON sur `TaskSession`)

## Périodes

Détectées automatiquement selon l'heure Paris via `src/lib/date.ts` :

- **matin** : 6h–14h
- **soir** : 14h–minuit

## Flux complet

1. `validateAndSyncConfig()` au démarrage — vérifie la config et sync les enfants en DB
2. `getOrCreateSession()` — crée la session si elle n'existe pas, charge les skips existants dans le store
3. L'enfant coche ses tâches → `updateSessionCompletions()` à chaque coche
4. _(Optionnel)_ Le parent fait un appui long sur une tâche → mot de passe → `skipTask()` → tâche cachée
5. Le parent entre son mot de passe → `verifyParentPassword()` → `validateSession()`

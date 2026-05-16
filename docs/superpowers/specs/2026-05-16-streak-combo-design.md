# Série / combo de victoires — Design

Date : 2026-05-16
Statut : approuvé, prêt pour la planification d'implémentation

## Contexte

Les enfants effectuent des tâches deux fois par jour (matin/soir). À chaque validation parent honnête, ils gagnent des points (1 par tâche dans les temps + bonus 5 si toutes faites dans les temps).

On souhaite ajouter une mécanique d'engagement type Snapchat : un compteur de **série** qui s'incrémente à chaque demi-journée pleinement réussie, avec des paliers visuels et un bonus de points en pourcentage.

Contrainte forte : un parent doit pouvoir valider la session du matin le soir en rentrant du travail (ou même plus tard) sans casser la série.

## Définitions

- **Demi-journée "100% réussie"** : session validée honnêtement, avec `activeCompletions.length === activeTasks.length` et `activeTasks.length > 0`. Les retards (tâches faites après deadline) **ne cassent pas la série**, mais ne rapportent pas le point individuel ni le bonus quotidien.
- **Demi-journée "ratée"** : session validée honnêtement avec au moins une tâche active non cochée, OU validée "malhonnête" (triche, 0 point).
- **Demi-journée "neutre"** : session jamais validée (le parent peut rattraper plus tard, même plusieurs jours après) OU session validée avec aucune tâche active restante après skips (`activeTasks.length === 0`). Aucun impact sur la série.

## Règles de mise à jour de la série

Effectuées dans `validateSession`, dans la même transaction que la mise à jour des points :

```
si honest === false → child.streak = 0
sinon si activeTasks.length === 0 → child.streak inchangée
sinon si activeCompletions.length === activeTasks.length → child.streak += 1
sinon → child.streak = 0
```

## Paliers et bonus

| Plage de série | Palier appliqué | Bonus % | Icône            |
| -------------- | --------------- | ------- | ---------------- |
| 0–4            | aucun           | 0%      | rien             |
| 5–9            | palier 1        | +5%     | ⚡ étincelle     |
| 10–14          | palier 2        | +10%    | ⭐ étoile        |
| 15–19          | palier 3        | +15%    | 🌟 étoile dorée  |
| 20+            | palier 4 (cap)  | +20%    | 🔥 flamme animée |

Le bonus s'applique **après l'increment** : la session qui fait passer la série de 4 à 5 obtient déjà +5%.

Au-delà de 20, le bonus plateaune à +20% mais le compteur continue (l'icône reste la flamme animée).

## Calcul des points avec bonus

```
basePoints  = calculatePoints(tasks, completions, skippedIndices)   // logique actuelle inchangée
newStreak   = computeNewStreak(child.streak, honest, activeTasks, activeCompletions)
streakLevel = newStreak >= 20 ? 20
             : newStreak >= 15 ? 15
             : newStreak >= 10 ? 10
             : newStreak >= 5  ? 5
             : 0
bonusPct    = streakLevel / 100
finalPoints = basePoints === 0 ? 0 : Math.ceil(basePoints * (1 + bonusPct))
```

**Arrondi supérieur** pour garantir qu'un bonus se traduit toujours par au moins +1 point quand `basePoints > 0`.

Si `basePoints === 0` (triche), `finalPoints = 0` et la série est de toute façon remise à 0.

## Modèle de données

Ajouter une colonne `streak` au modèle `Child` :

```prisma
model Child {
  id        Int           @id @default(autoincrement())
  name      String        @unique
  points    Int           @default(0)
  streak    Int           @default(0)
  sessions  TaskSession[]
  purchases Purchase[]
}
```

Pas de migration des sessions passées : tous les enfants démarrent à `streak = 0` au déploiement.

## Server functions

### `validateSession` (modifiée)

Changements :

- En tête de handler : si `session.validated === true`, retourner immédiatement (idempotence — évite tout double-comptage).
- Calculer `newStreak` selon les règles ci-dessus.
- Calculer `finalPoints` avec le bonus appliqué.
- Transaction Prisma : toujours mettre à jour `child` avec `streak: newStreak` et (si `finalPoints > 0`) `points: { increment: finalPoints }`. La mise à jour `child` n'est plus conditionnée à `points > 0` car la série doit être persistée même en cas de reset (triche, demi-journée ratée).
- Mettre à jour `session.pointsEarned = finalPoints` (et non plus `basePoints`).

### `getOrCreateSession` (étendue)

Retourner aussi `child.streak` pour que le ChildPanel puisse afficher la série sans appel supplémentaire. Modifier le `include`/`select` Prisma.

### Helper pur

Extraire dans `src/server/sessions.ts` une fonction pure et testable :

```ts
export function computeStreakUpdate(args: {
  currentStreak: number
  honest: boolean
  activeTaskCount: number
  activeCompletionCount: number
}): { newStreak: number; streakLevel: 0 | 5 | 10 | 15 | 20; bonusPct: number }
```

Utilisée par `validateSession` et couverte par les tests unitaires.

## UI

### `ChildPanel.tsx`

En-tête du panel, à côté du prénom de l'enfant :

- Si `streak >= 5` : badge `{icône} {streak}` (ex : `🔥 22`)
- Si `streak < 5` : rien affiché (pas de "compteur à zéro" visible — on évite d'afficher l'absence de série)

Tooltip / `title` HTML : "Série de X — bonus +Y% sur tes points".

L'icône change visuellement aux paliers :

- 5–9 : ⚡ couleur bleue/cyan
- 10–14 : ⭐ couleur argent
- 15–19 : 🌟 dorée (gold)
- 20+ : 🔥 flamme avec animation CSS légère (flicker keyframes, sobre)

Pas de pop-up de célébration au passage de palier (non demandé). Le changement d'icône au prochain rendu joue ce rôle visuellement.

### Composant dédié

Créer `src/components/StreakBadge.tsx` (composant pur, props : `streak: number`). Encapsule la logique palier → icône + couleur + animation. Réutilisable si on souhaite l'afficher ailleurs plus tard.

## Tests

Étendre `src/server/sessions.test.ts` pour couvrir le helper `computeStreakUpdate` :

- Série incrémentée si toutes tâches actives cochées (même en retard)
- Série remise à 0 si triche (`honest = false`)
- Série remise à 0 si tâche active non cochée
- Série inchangée si `activeTaskCount === 0`
- `streakLevel` et `bonusPct` corrects pour les valeurs frontières : 4 → 0, 5 → 5, 9 → 5, 10 → 10, 14 → 10, 15 → 15, 19 → 15, 20 → 20, 50 → 20

Étendre les tests existants de `calculatePoints` / `validateSession` (ou en ajouter) pour vérifier l'application du bonus :

- `basePoints = 8`, série passe à 5 → finalPoints = 9
- `basePoints = 8`, série passe à 20 → finalPoints = 10
- `basePoints = 0` (triche) → finalPoints = 0, streak = 0
- Arrondi supérieur correct : `basePoints = 1`, série 5 → `ceil(1.05) = 2`

## Documentation

- Mettre à jour `docs/tasks.md` : ajouter une section "Série / combo" expliquant les règles d'incrément, les paliers, le calcul du bonus.
- Mettre à jour `docs/index.md` si nécessaire (la table des features ne change pas, c'est une extension de `tasks.md`).
- Pas de nouvelle route ni de nouvelle feature transverse à documenter séparément.

## Non-objectifs (YAGNI)

- Pas d'affichage de la série sur `/recompenses` ni `/parents`.
- Pas de pop-up ni de célébration animée au passage de palier (le changement d'icône suffit).
- Pas d'historique des séries passées (record maximum, etc.).
- Pas de rétro-calcul depuis les sessions passées au déploiement.
- Pas de paramètre de configuration pour les seuils/bonus (les valeurs sont en dur, modifiables par code).

## Risques et points d'attention

- **Idempotence** : la vérification `if (session.validated) return` en tête de `validateSession` est désormais obligatoire — sans elle, une double validation incrémenterait deux fois la série.
- **Ordre de validation hors séquence** : un parent peut valider matin J après soir J. La série compte simplement les validations réussies dans l'ordre où elles sont validées, pas dans l'ordre chronologique des demi-journées. C'est accepté par design (validation tardive ne casse pas).
- **Skips parents** : si le parent skip toutes les tâches (`activeTasks.length === 0`), la série est inchangée. Cas marginal mais explicite.

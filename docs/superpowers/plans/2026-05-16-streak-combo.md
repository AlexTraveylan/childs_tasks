# Série / combo de victoires — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une mécanique de série/combo type Snapchat : compteur `streak` par enfant, incrémenté à chaque demi-journée pleinement réussie, avec 4 paliers visuels (5/10/15/20) donnant un bonus de points en pourcentage (+5/+10/+15/+20%) appliqué sur le total de la session.

**Architecture:** Compteur stocké en colonne `streak` sur `Child`, mis à jour atomiquement dans `validateSession`. Helpers purs centralisés dans `src/lib/streak.ts` (testables sans DB), réutilisés côté serveur (calcul du bonus) et côté client (rendu du badge). UI : nouveau composant `StreakBadge` affiché dans l'en-tête de `ChildPanel`, masqué tant que `streak < 5`.

**Tech Stack:** Prisma 7 + SQLite, TanStack Start (server functions), React 19, Tailwind 4, Vitest.

**Référence design:** `docs/superpowers/specs/2026-05-16-streak-combo-design.md`

---

## File Structure

| Fichier                                 | Action   | Responsabilité                                                             |
| --------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `prisma/schema.prisma`                  | Modifier | Ajouter colonne `streak` sur `Child`                                       |
| `src/lib/streak.ts`                     | Créer    | Helpers purs : `getStreakLevel`, `computeStreakUpdate`, `applyStreakBonus` |
| `src/lib/streak.test.ts`                | Créer    | Tests unitaires des helpers purs                                           |
| `src/server/sessions.ts`                | Modifier | Intégrer helpers dans `validateSession` + idempotence + bonus              |
| `src/components/StreakBadge.tsx`        | Créer    | Composant React qui rend l'icône + chiffre selon le palier                 |
| `src/components/ChildPanel.tsx`         | Modifier | Accepter prop `streak`, afficher `StreakBadge` dans le header              |
| `src/routes/index.tsx`                  | Modifier | Passer `child.streak` au `ChildPanel`                                      |
| `src/styles.css` (ou équivalent global) | Modifier | Keyframes CSS pour l'animation flamme (palier 20+)                         |
| `docs/tasks.md`                         | Modifier | Documenter la mécanique de série + paliers                                 |

`src/server/children.ts` n'a **pas besoin** d'être modifié : `prisma.child.findMany()` retourne déjà tous les champs du modèle, donc `streak` sera disponible automatiquement côté client une fois la colonne ajoutée.

---

## Task 1 : Ajouter la colonne `streak` au modèle `Child`

**Files:**

- Modify: `prisma/schema.prisma:10-16`

- [ ] **Step 1 : Ajouter la colonne au modèle Prisma**

Modifier `prisma/schema.prisma`, dans le modèle `Child`, en insérant la ligne `streak` après `points` :

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

- [ ] **Step 2 : Pousser le schéma vers la DB**

Run: `npm run db:push`

Expected output : "Your database is now in sync with your Prisma schema." (ou message équivalent confirmant la migration sans perte de données).

- [ ] **Step 3 : Régénérer le client Prisma**

Run: `npm run db:generate`

Expected output : "Generated Prisma Client" sans erreur.

- [ ] **Step 4 : Vérifier que les enfants existants ont bien `streak = 0`**

Run:

```bash
sqlite3 prisma/dev.db "SELECT id, name, points, streak FROM Child;"
```

Expected output : chaque ligne contient `streak = 0`. Exemple :

```
1|Agathe|0|0
2|Maxence|0|0
```

(Si le chemin de la DB diffère, vérifier `.env.local` → `DATABASE_URL`.)

- [ ] **Step 5 : Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(streak): add streak column to Child model"
```

---

## Task 2 : Créer les helpers purs `src/lib/streak.ts` (TDD)

**Files:**

- Create: `src/lib/streak.ts`
- Test: `src/lib/streak.test.ts`

Ces helpers seront utilisés à la fois par le serveur (`validateSession`) et le client (`StreakBadge`). Ils sont purs et n'ont aucune dépendance Prisma/React.

- [ ] **Step 1 : Écrire le fichier de tests (rouge)**

Create `src/lib/streak.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import {
  getStreakLevel,
  computeStreakUpdate,
  applyStreakBonus,
} from '#/lib/streak'

describe('getStreakLevel', () => {
  it('retourne 0 pour streak < 5', () => {
    expect(getStreakLevel(0)).toBe(0)
    expect(getStreakLevel(4)).toBe(0)
  })

  it('retourne 5 pour 5 ≤ streak < 10', () => {
    expect(getStreakLevel(5)).toBe(5)
    expect(getStreakLevel(9)).toBe(5)
  })

  it('retourne 10 pour 10 ≤ streak < 15', () => {
    expect(getStreakLevel(10)).toBe(10)
    expect(getStreakLevel(14)).toBe(10)
  })

  it('retourne 15 pour 15 ≤ streak < 20', () => {
    expect(getStreakLevel(15)).toBe(15)
    expect(getStreakLevel(19)).toBe(15)
  })

  it('retourne 20 (plateau) pour streak ≥ 20', () => {
    expect(getStreakLevel(20)).toBe(20)
    expect(getStreakLevel(50)).toBe(20)
    expect(getStreakLevel(999)).toBe(20)
  })
})

describe('computeStreakUpdate', () => {
  it('incrémente la série si toutes les tâches actives sont cochées', () => {
    const r = computeStreakUpdate({
      currentStreak: 4,
      honest: true,
      activeTaskCount: 3,
      activeCompletionCount: 3,
    })
    expect(r.newStreak).toBe(5)
    expect(r.streakLevel).toBe(5)
    expect(r.bonusPct).toBe(0.05)
  })

  it('remet la série à 0 si validation malhonnête', () => {
    const r = computeStreakUpdate({
      currentStreak: 12,
      honest: false,
      activeTaskCount: 3,
      activeCompletionCount: 3,
    })
    expect(r.newStreak).toBe(0)
    expect(r.streakLevel).toBe(0)
    expect(r.bonusPct).toBe(0)
  })

  it('remet la série à 0 si au moins une tâche active n est pas cochée', () => {
    const r = computeStreakUpdate({
      currentStreak: 8,
      honest: true,
      activeTaskCount: 3,
      activeCompletionCount: 2,
    })
    expect(r.newStreak).toBe(0)
    expect(r.streakLevel).toBe(0)
    expect(r.bonusPct).toBe(0)
  })

  it('laisse la série inchangée si aucune tâche active', () => {
    const r = computeStreakUpdate({
      currentStreak: 7,
      honest: true,
      activeTaskCount: 0,
      activeCompletionCount: 0,
    })
    expect(r.newStreak).toBe(7)
    expect(r.streakLevel).toBe(5)
    expect(r.bonusPct).toBe(0.05)
  })

  it('plafonne le palier à 20 même si la série dépasse', () => {
    const r = computeStreakUpdate({
      currentStreak: 49,
      honest: true,
      activeTaskCount: 2,
      activeCompletionCount: 2,
    })
    expect(r.newStreak).toBe(50)
    expect(r.streakLevel).toBe(20)
    expect(r.bonusPct).toBe(0.2)
  })
})

describe('applyStreakBonus', () => {
  it('retourne 0 si basePoints vaut 0', () => {
    expect(applyStreakBonus(0, 0.2)).toBe(0)
  })

  it('retourne basePoints inchangé si bonusPct vaut 0', () => {
    expect(applyStreakBonus(8, 0)).toBe(8)
  })

  it('applique le bonus avec arrondi supérieur (5%)', () => {
    // 8 * 1.05 = 8.4 → ceil → 9
    expect(applyStreakBonus(8, 0.05)).toBe(9)
  })

  it('applique le bonus avec arrondi supérieur (20%)', () => {
    // 8 * 1.20 = 9.6 → ceil → 10
    expect(applyStreakBonus(8, 0.2)).toBe(10)
  })

  it('garantit au moins +1 point sur petites sessions', () => {
    // 1 * 1.05 = 1.05 → ceil → 2
    expect(applyStreakBonus(1, 0.05)).toBe(2)
  })
})
```

- [ ] **Step 2 : Lancer les tests, vérifier qu'ils échouent**

Run: `npm test -- src/lib/streak.test.ts`

Expected : `FAIL` avec une erreur d'import/résolution sur `#/lib/streak` (le fichier n'existe pas encore).

- [ ] **Step 3 : Créer l'implémentation**

Create `src/lib/streak.ts` :

```ts
export type StreakLevel = 0 | 5 | 10 | 15 | 20

export type StreakUpdate = {
  newStreak: number
  streakLevel: StreakLevel
  bonusPct: number
}

export type StreakUpdateInput = {
  currentStreak: number
  honest: boolean
  activeTaskCount: number
  activeCompletionCount: number
}

export function getStreakLevel(streak: number): StreakLevel {
  if (streak >= 20) return 20
  if (streak >= 15) return 15
  if (streak >= 10) return 10
  if (streak >= 5) return 5
  return 0
}

export function computeStreakUpdate(input: StreakUpdateInput): StreakUpdate {
  const { currentStreak, honest, activeTaskCount, activeCompletionCount } =
    input

  let newStreak: number
  if (!honest) {
    newStreak = 0
  } else if (activeTaskCount === 0) {
    newStreak = currentStreak
  } else if (activeCompletionCount === activeTaskCount) {
    newStreak = currentStreak + 1
  } else {
    newStreak = 0
  }

  const streakLevel = getStreakLevel(newStreak)
  const bonusPct = streakLevel / 100

  return { newStreak, streakLevel, bonusPct }
}

export function applyStreakBonus(basePoints: number, bonusPct: number): number {
  if (basePoints === 0) return 0
  return Math.ceil(basePoints * (1 + bonusPct))
}
```

- [ ] **Step 4 : Relancer les tests, vérifier qu'ils passent**

Run: `npm test -- src/lib/streak.test.ts`

Expected : tous les tests `PASS` (5 + 5 + 5 = 15 cas couverts).

- [ ] **Step 5 : Lancer la suite complète pour vérifier non-régression**

Run: `npm test`

Expected : toutes les suites passent (les 3 fichiers existants + le nouveau).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/streak.ts src/lib/streak.test.ts
git commit -m "feat(streak): add pure streak helpers (level, update, bonus)"
```

---

## Task 3 : Intégrer les helpers dans `validateSession`

**Files:**

- Modify: `src/server/sessions.ts:144-178`

Cette tâche modifie le handler `validateSession` pour : (a) garantir l'idempotence, (b) calculer la nouvelle série, (c) appliquer le bonus, (d) persister la série sur `Child`.

- [ ] **Step 1 : Modifier le handler `validateSession`**

Dans `src/server/sessions.ts`, remplacer le bloc actuel :

```ts
export const validateSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { sessionId: number; honest: boolean; tasks: Task[] }) => d,
  )
  .handler(async ({ data }) => {
    const session = await prisma.taskSession.findUniqueOrThrow({
      where: { id: data.sessionId },
    })
    const completions = JSON.parse(session.completions) as CompletionRecord[]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const skips = JSON.parse(session.skips ?? '[]') as SkipRecord[]
    const skippedIndices = skips.map((s) => s.taskIndex)
    const points = data.honest
      ? calculatePoints(data.tasks, completions, skippedIndices)
      : 0

    await prisma.$transaction([
      prisma.taskSession.update({
        where: { id: data.sessionId },
        data: {
          validated: true,
          validatedAt: new Date(),
          pointsEarned: points,
        },
      }),
      ...(points > 0
        ? [
            prisma.child.update({
              where: { id: session.childId },
              data: { points: { increment: points } },
            }),
          ]
        : []),
    ])
  })
```

par :

```ts
export const validateSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { sessionId: number; honest: boolean; tasks: Task[] }) => d,
  )
  .handler(async ({ data }) => {
    const session = await prisma.taskSession.findUniqueOrThrow({
      where: { id: data.sessionId },
      include: { child: true },
    })

    if (session.validated) return

    const completions = JSON.parse(session.completions) as CompletionRecord[]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const skips = JSON.parse(session.skips ?? '[]') as SkipRecord[]
    const skippedIndices = skips.map((s) => s.taskIndex)
    const skippedSet = new Set(skippedIndices)

    const activeTaskCount = data.tasks.filter(
      (_, i) => !skippedSet.has(i),
    ).length
    const activeCompletionCount = completions.filter(
      (c) => !skippedSet.has(c.taskIndex),
    ).length

    const basePoints = data.honest
      ? calculatePoints(data.tasks, completions, skippedIndices)
      : 0

    const { newStreak, bonusPct } = computeStreakUpdate({
      currentStreak: session.child.streak,
      honest: data.honest,
      activeTaskCount,
      activeCompletionCount,
    })

    const finalPoints = applyStreakBonus(basePoints, bonusPct)

    await prisma.$transaction([
      prisma.taskSession.update({
        where: { id: data.sessionId },
        data: {
          validated: true,
          validatedAt: new Date(),
          pointsEarned: finalPoints,
        },
      }),
      prisma.child.update({
        where: { id: session.childId },
        data: {
          streak: newStreak,
          ...(finalPoints > 0 ? { points: { increment: finalPoints } } : {}),
        },
      }),
    ])
  })
```

- [ ] **Step 2 : Ajouter l'import des helpers**

En tête de `src/server/sessions.ts`, ajouter à la liste des imports :

```ts
import { computeStreakUpdate, applyStreakBonus } from '#/lib/streak'
```

- [ ] **Step 3 : Lancer la suite de tests complète**

Run: `npm test`

Expected : toutes les suites passent (aucune régression sur `calculatePoints` ou `streak`).

- [ ] **Step 4 : Vérifier le typecheck via le build**

Run: `npm run lint`

Expected : pas d'erreur ESLint/TS. Si une erreur "include returns child not in select" apparaît, c'est que le générateur Prisma n'a pas été relancé — re-run `npm run db:generate`.

- [ ] **Step 5 : Test manuel end-to-end**

Run: `npm run dev` (dans un autre terminal)

Ouvrir `http://localhost:3000`, cocher toutes les tâches d'un enfant, valider avec le mot de passe parent.

Vérifier en DB :

```bash
sqlite3 prisma/dev.db "SELECT name, points, streak FROM Child;"
```

Expected : la série de l'enfant validé est à 1, les points ont augmenté.

Arrêter `npm run dev` quand validé.

- [ ] **Step 6 : Commit**

```bash
git add src/server/sessions.ts
git commit -m "feat(streak): integrate streak update and bonus in validateSession"
```

---

## Task 4 : Créer le composant `StreakBadge`

**Files:**

- Create: `src/components/StreakBadge.tsx`

Composant React pur (props : `streak: number`). Retourne `null` si `streak < 5`. Sinon affiche l'icône + le chiffre, avec une couleur/animation propre au palier.

- [ ] **Step 1 : Créer le fichier**

Create `src/components/StreakBadge.tsx` :

```tsx
import { getStreakLevel } from '#/lib/streak'

interface StreakBadgeProps {
  streak: number
}

type TierConfig = {
  icon: string
  className: string
}

const TIER_CONFIG: Record<5 | 10 | 15 | 20, TierConfig> = {
  5: {
    icon: '⚡',
    className: 'bg-sky-100 text-sky-700 border-sky-300',
  },
  10: {
    icon: '⭐',
    className: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  },
  15: {
    icon: '🌟',
    className: 'bg-amber-100 text-amber-700 border-amber-400',
  },
  20: {
    icon: '🔥',
    className:
      'bg-orange-100 text-orange-700 border-orange-400 animate-flame-flicker',
  },
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const level = getStreakLevel(streak)
  if (level === 0) return null

  const config = TIER_CONFIG[level]
  const bonusPct = level

  return (
    <span
      title={`Série de ${streak} — bonus +${bonusPct}% sur tes points`}
      className={`inline-flex items-center gap-1 text-sm font-black px-2.5 py-1 rounded-full border-2 shrink-0 ${config.className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{streak}</span>
    </span>
  )
}
```

- [ ] **Step 2 : Vérifier que le fichier typecheck**

Run: `npm run lint`

Expected : pas d'erreur. Le composant n'est pas encore utilisé donc il peut déclencher un warning "unused export" — c'est OK, il sera consommé à la Task 6.

- [ ] **Step 3 : Commit**

```bash
git add src/components/StreakBadge.tsx
git commit -m "feat(streak): add StreakBadge component with 4 tiers"
```

---

## Task 5 : Ajouter l'animation CSS `flame-flicker`

**Files:**

- Modify: `src/styles.css`

L'animation est utilisée uniquement par le palier 20+ (classe `animate-flame-flicker` référencée dans `StreakBadge`). Effet : léger flicker d'opacité + scale très doux, sans clignoter trop fort.

- [ ] **Step 1 : Localiser le fichier de styles global**

Run: `ls src/styles.css`

Si le fichier n'existe pas, run : `find src -name "*.css" -not -path "*/node_modules/*"` et utiliser le fichier global (probablement importé dans `__root.tsx`).

- [ ] **Step 2 : Ajouter les keyframes**

À la fin de `src/styles.css` (ou du fichier CSS global équivalent), ajouter :

```css
@keyframes flame-flicker {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  25% {
    transform: scale(1.03);
    filter: brightness(1.1);
  }
  50% {
    transform: scale(0.99);
    filter: brightness(0.95);
  }
  75% {
    transform: scale(1.02);
    filter: brightness(1.05);
  }
}

.animate-flame-flicker {
  animation: flame-flicker 1.6s ease-in-out infinite;
}
```

- [ ] **Step 3 : Vérifier visuellement (optionnel à ce stade — le badge n'est pas encore monté)**

Le test visuel arrive en Task 6. Pour l'instant, vérifier juste que le serveur dev démarre sans erreur CSS :

Run: `npm run dev` puis arrêter (Ctrl+C) une fois le démarrage confirmé sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/styles.css
git commit -m "feat(streak): add flame-flicker animation for tier 4 badge"
```

---

## Task 6 : Intégrer la série dans `ChildPanel` et la route d'accueil

**Files:**

- Modify: `src/components/ChildPanel.tsx:33-44, 137-144`
- Modify: `src/routes/index.tsx:28, 202-220`

- [ ] **Step 1 : Ajouter la prop `streak` à `ChildPanel`**

Dans `src/components/ChildPanel.tsx`, modifier le bloc d'imports pour ajouter `StreakBadge` :

```tsx
import { StreakBadge } from '#/components/StreakBadge'
```

Modifier l'interface `ChildPanelProps` (lignes ~33-44) pour ajouter `streak` :

```tsx
interface ChildPanelProps {
  childName: string
  points: number
  streak: number
  tasks: Task[]
  completions: Record<number, Completion>
  skips: Record<number, Skip>
  onToggle: (taskIndex: number) => void
  onSkip: (taskIndex: number, password: string) => Promise<string | null>
  lastMessage?: string
  validated?: boolean
  onValidate?: (password: string, honest: boolean) => Promise<string | null>
}
```

Modifier la signature de la fonction `ChildPanel` pour destructurer `streak` :

```tsx
export function ChildPanel({
  childName,
  points,
  streak,
  tasks,
  completions,
  skips,
  onToggle,
  onSkip,
  lastMessage,
  validated = false,
  onValidate,
}: ChildPanelProps) {
```

- [ ] **Step 2 : Afficher le badge dans le header**

Toujours dans `src/components/ChildPanel.tsx`, remplacer le bloc header (lignes ~137-144) :

```tsx
<div className="flex items-center justify-between gap-2">
  <h2 className="text-lg font-black tracking-wide text-primary truncate capitalize">
    {childName}
  </h2>
  <Badge className="bg-secondary text-secondary-foreground font-black text-sm px-2.5 py-1 rounded-full shrink-0">
    ⭐ {points}
  </Badge>
</div>
```

par :

```tsx
<div className="flex items-center justify-between gap-2">
  <h2 className="text-lg font-black tracking-wide text-primary truncate capitalize">
    {childName}
  </h2>
  <div className="flex items-center gap-1.5 shrink-0">
    <StreakBadge streak={streak} />
    <Badge className="bg-secondary text-secondary-foreground font-black text-sm px-2.5 py-1 rounded-full shrink-0">
      ⭐ {points}
    </Badge>
  </div>
</div>
```

- [ ] **Step 3 : Étendre le type `Child` côté route et passer `streak`**

Dans `src/routes/index.tsx`, ligne 28, modifier le type :

```tsx
type Child = { id: number; name: string; points: number; streak: number }
```

Lignes ~202-220, dans le `map` qui rend les `ChildPanel`, ajouter `streak={child.streak}` :

```tsx
children.map((child) => (
  <div key={child.id} className="flex-1 overflow-auto min-w-0">
    <ChildPanel
      childName={child.name}
      points={child.points}
      streak={child.streak}
      tasks={tasks[child.name] ?? []}
      completions={completions[child.name] ?? {}}
      skips={skips[child.name] ?? {}}
      onToggle={(idx) => handleToggle(child.name, idx)}
      onSkip={(idx, pwd) => handleSkip(child.name, idx, pwd)}
      lastMessage={messages[child.name]}
      validated={validated[child.name] ?? false}
      onValidate={(pwd, honest) => handleValidate(child.name, pwd, honest)}
    />
  </div>
))
```

(`getChildren` retourne déjà tous les champs Prisma, dont `streak` après la Task 1. Pas besoin de modifier `src/server/children.ts`.)

- [ ] **Step 4 : Lancer le lint et les tests**

Run en parallèle :

- `npm run lint`
- `npm test`

Expected : tout passe, aucun type error sur `streak`.

- [ ] **Step 5 : Test manuel end-to-end**

Run: `npm run dev`

Cas à vérifier dans le navigateur (`http://localhost:3000`) :

1. **streak = 0** : aucun badge série visible à côté du prénom, juste le badge ⭐ points.
2. Forcer `streak = 5` en DB :
   ```bash
   sqlite3 prisma/dev.db "UPDATE Child SET streak = 5 WHERE name = 'Maxence';"
   ```
   Rafraîchir la page → badge `⚡ 5` visible, fond cyan/sky.
3. `streak = 12` :
   ```bash
   sqlite3 prisma/dev.db "UPDATE Child SET streak = 12 WHERE name = 'Maxence';"
   ```
   → `⭐ 12`, fond argent.
4. `streak = 17` → `🌟 17`, fond doré.
5. `streak = 23` → `🔥 23`, fond orange avec animation flicker visible.
6. Tooltip au survol : "Série de X — bonus +Y% sur tes points".
7. Valider une session avec toutes les tâches faites → la série incrémente de +1 et un bonus est appliqué aux points (vérifier en DB).
8. Valider une session "triche" → la série retombe à 0 et le badge disparaît.

Remettre les séries à 0 quand fini :

```bash
sqlite3 prisma/dev.db "UPDATE Child SET streak = 0;"
```

Arrêter `npm run dev`.

- [ ] **Step 6 : Commit**

```bash
git add src/components/ChildPanel.tsx src/routes/index.tsx
git commit -m "feat(streak): wire streak badge into ChildPanel header"
```

---

## Task 7 : Mettre à jour la documentation

**Files:**

- Modify: `docs/tasks.md`

- [ ] **Step 1 : Ajouter une section "Série / combo" dans `docs/tasks.md`**

À la fin de `docs/tasks.md`, après la section "Flux complet", ajouter :

````markdown
## Série / combo de victoires

Chaque enfant a un compteur `streak` (colonne sur `Child`) qui mesure le nombre consécutif de demi-journées pleinement réussies.

### Règles d'incrément (dans `validateSession`)

- **+1** si validation honnête ET toutes les tâches actives sont cochées (retards inclus, pas de pénalité)
- **0** (reset) si validation "triche", ou si une tâche active reste non cochée
- **inchangée** si toutes les tâches ont été skippées par le parent (`activeTaskCount === 0`)
- **inchangée** si la session n'a jamais été validée (le parent peut rattraper plus tard sans casser la série)

### Paliers et bonus

| Série | Bonus | Icône            |
| ----- | ----- | ---------------- |
| 0–4   | 0%    | aucun            |
| 5–9   | +5%   | ⚡ étincelle     |
| 10–14 | +10%  | ⭐ étoile argent |
| 15–19 | +15%  | 🌟 étoile dorée  |
| 20+   | +20%  | 🔥 flamme animée |

### Calcul du bonus

Le bonus s'applique **après increment** sur le total `basePoints` de la session :

```
finalPoints = basePoints === 0 ? 0 : Math.ceil(basePoints × (1 + bonusPct))
```

Arrondi supérieur pour garantir +1 point minimum quand `basePoints > 0`.

### Helpers

`src/lib/streak.ts` :

- `getStreakLevel(streak)` → palier 0/5/10/15/20
- `computeStreakUpdate({ currentStreak, honest, activeTaskCount, activeCompletionCount })` → `{ newStreak, streakLevel, bonusPct }`
- `applyStreakBonus(basePoints, bonusPct)` → points avec bonus

### Affichage

`src/components/StreakBadge.tsx` — affiché dans l'en-tête de `ChildPanel` à côté du prénom. Masqué si `streak < 5`.

### Idempotence

`validateSession` retourne immédiatement si `session.validated === true`. Sans cette garde, une double validation incrémenterait deux fois la série.
````

- [ ] **Step 2 : Vérifier le format Prettier**

Run: `npx prettier --check docs/tasks.md`

Si "Code style issues found", run : `npx prettier --write docs/tasks.md`.

- [ ] **Step 3 : Commit**

```bash
git add docs/tasks.md
git commit -m "docs: document streak/combo mechanic in tasks.md"
```

---

## Self-Review Checklist (à faire après exécution)

- [ ] La suite de tests complète passe : `npm test`
- [ ] Aucun warning lint : `npm run lint`
- [ ] Le build de prod passe : `npm run build`
- [ ] Test manuel : enchaîner 5 validations honnêtes successives → badge ⚡ apparaît, points augmentés de ~5%
- [ ] Test manuel : valider "triche" → badge disparaît, points inchangés, `streak = 0` en DB
- [ ] Test manuel : valider une session matin LE LENDEMAIN MATIN (date différente) → la série continue (rappel : la contrainte forte "validation tardive ne casse pas")
- [ ] Le tooltip s'affiche au survol du badge
- [ ] L'animation flicker du palier 20 est sobre (pas épileptique)

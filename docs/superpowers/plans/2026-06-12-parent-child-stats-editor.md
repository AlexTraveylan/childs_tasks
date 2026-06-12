# Parent Child Stats Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une section en bas de l'espace parent affichant les points et la série de chaque enfant, éditables inline.

**Architecture:** On ajoute `setChildStat` à `src/server/children.ts` (fichier existant). La page `parents.tsx` récupère déjà les données via `loadData()` — on l'étend pour inclure `getChildren()` (déjà disponible dans `children.ts`). La section UI en bas de page gère un état d'édition local et sauvegarde au blur/Entrée.

**Tech Stack:** React 19, TanStack Start (server functions), Prisma 7 + SQLite, Tailwind CSS 4, Shadcn UI

---

## Fichiers impactés

| Fichier                  | Action   | Responsabilité                            |
| ------------------------ | -------- | ----------------------------------------- |
| `src/server/children.ts` | Modifier | Ajouter `setChildStat`                    |
| `src/routes/parents.tsx` | Modifier | Étendre `loadData`, ajouter section stats |
| `docs/parents.md`        | Modifier | Documenter la nouvelle section            |

---

### Task 1 : Ajouter `setChildStat` dans `src/server/children.ts`

**Files:**

- Modify: `src/server/children.ts`

> Pas de test unitaire pour cette tâche : `setChildStat` est un wrapper prisma pur, sans logique testable. Les tests existants dans ce projet ne mockent pas la DB et couvrent uniquement des fonctions pures.

- [ ] **Step 1 : Ouvrir et lire `src/server/children.ts`**

Contenu actuel :

```ts
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'

export const getChildren = createServerFn({ method: 'GET' }).handler(
  async () => {
    return prisma.child.findMany({ orderBy: { name: 'asc' } })
  },
)
```

- [ ] **Step 2 : Ajouter `setChildStat` à la fin du fichier**

```ts
export const setChildStat = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { childId: number; field: 'points' | 'streak'; value: number }) => d,
  )
  .handler(async ({ data }) => {
    await prisma.child.update({
      where: { id: data.childId },
      data: { [data.field]: data.value },
    })
  })
```

- [ ] **Step 3 : Vérifier que le lint passe**

```bash
npm run lint
```

Expected : `All matched files use Prettier code style!` + aucune erreur ESLint.

- [ ] **Step 4 : Commit**

```bash
git add src/server/children.ts
git commit -m "feat: add setChildStat server function"
```

---

### Task 2 : Étendre `parents.tsx` — données et UI

**Files:**

- Modify: `src/routes/parents.tsx`

- [ ] **Step 1 : Lire `src/routes/parents.tsx` en entier**

(Nécessaire avant toute modification — le fichier a ~208 lignes.)

- [ ] **Step 2 : Ajouter les imports manquants en haut du fichier**

Ajouter après les imports existants :

```ts
import { getChildren, setChildStat } from '#/server/children'
import { getStreakLevel } from '#/lib/streak'
```

- [ ] **Step 3 : Ajouter le type `Child` et l'état `children`**

Après les lignes de types existantes :

```ts
type Child = Awaited<ReturnType<typeof getChildren>>[number]
```

Dans la fonction `ParentsPage`, après les `useState` existants :

```ts
const [children, setChildren] = useState<Child[]>([])
const [editingChild, setEditingChild] = useState<{
  id: number
  field: 'points' | 'streak'
  value: string
} | null>(null)
```

- [ ] **Step 4 : Étendre `loadData` pour charger les enfants**

Remplacer le corps de `loadData` :

```ts
async function loadData() {
  const [sess, purch, kids] = await Promise.all([
    getPendingSessions(),
    getPendingPurchases(),
    getChildren(),
  ])
  setSessions(sess)
  setPending(purch)
  setChildren(kids)
}
```

- [ ] **Step 5 : Ajouter le handler de sauvegarde**

Ajouter après `handleShowHistory` :

```ts
async function handleStatSave() {
  if (!editingChild) return
  const child = children.find((c) => c.id === editingChild.id)
  if (!child) return
  const newValue = parseInt(editingChild.value, 10)
  if (isNaN(newValue) || newValue < 0) {
    setEditingChild(null)
    return
  }
  if (newValue === child[editingChild.field]) {
    setEditingChild(null)
    return
  }
  await setChildStat({
    data: {
      childId: editingChild.id,
      field: editingChild.field,
      value: newValue,
    },
  })
  await loadData()
  setEditingChild(null)
}
```

- [ ] **Step 6 : Ajouter le helper d'icône de série**

Ajouter au niveau module, **avant** la fonction `ParentsPage` (après les déclarations de types) :

```ts
const STREAK_ICONS: Record<number, string> = {
  0: '',
  1: '🌱',
  5: '⚡',
  10: '⭐',
  15: '🌟',
  20: '🔥',
}

function streakIcon(streak: number): string {
  return STREAK_ICONS[getStreakLevel(streak)] ?? ''
}
```

- [ ] **Step 7 : Ajouter la section UI en bas de page**

Ajouter après la section `{/* Historique */}` et avant la fermeture `</div>` :

```tsx
{
  /* Scores des enfants */
}
;<section>
  <h2 className="text-lg font-black mb-3">🏅 Scores des enfants</h2>
  <div className="space-y-3">
    {children.map((child) => (
      <div
        key={child.id}
        className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4"
      >
        <span className="font-black text-primary text-lg">{child.name}</span>
        <div className="flex gap-4 items-center">
          {/* Points */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-muted-foreground">
              🏆
            </span>
            {editingChild?.id === child.id &&
            editingChild.field === 'points' ? (
              <input
                type="number"
                min={0}
                className="w-20 text-center font-black text-lg border border-border rounded-lg px-2 py-0.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={editingChild.value}
                autoFocus
                onChange={(e) =>
                  setEditingChild({ ...editingChild, value: e.target.value })
                }
                onBlur={handleStatSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStatSave()
                  if (e.key === 'Escape') setEditingChild(null)
                }}
              />
            ) : (
              <button
                className="font-black text-lg tabular-nums hover:text-primary transition-colors cursor-text"
                onClick={() =>
                  setEditingChild({
                    id: child.id,
                    field: 'points',
                    value: String(child.points),
                  })
                }
              >
                {child.points} pts
              </button>
            )}
          </div>
          {/* Série */}
          <div className="flex items-center gap-1">
            {editingChild?.id === child.id &&
            editingChild.field === 'streak' ? (
              <input
                type="number"
                min={0}
                className="w-16 text-center font-black text-lg border border-border rounded-lg px-2 py-0.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={editingChild.value}
                autoFocus
                onChange={(e) =>
                  setEditingChild({ ...editingChild, value: e.target.value })
                }
                onBlur={handleStatSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStatSave()
                  if (e.key === 'Escape') setEditingChild(null)
                }}
              />
            ) : (
              <button
                className="font-black text-lg tabular-nums hover:text-primary transition-colors cursor-text flex items-center gap-1"
                onClick={() =>
                  setEditingChild({
                    id: child.id,
                    field: 'streak',
                    value: String(child.streak),
                  })
                }
              >
                {streakIcon(child.streak) && (
                  <span>{streakIcon(child.streak)}</span>
                )}
                <span>{child.streak}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 8 : Vérifier que le lint et les tests passent**

```bash
npm run lint && npm test
```

Expected : `All matched files use Prettier code style!` + `33 passed`.

- [ ] **Step 9 : Commit**

```bash
git add src/routes/parents.tsx
git commit -m "feat: add editable child stats section in parent dashboard"
```

---

### Task 3 : Mettre à jour `docs/parents.md`

**Files:**

- Modify: `docs/parents.md`

- [ ] **Step 1 : Ajouter la section 4 dans le doc**

Ouvrir `docs/parents.md` et ajouter à la fin :

```markdown
### 4. Scores des enfants

Affiche les points et la série actuels de chaque enfant (`getChildren()` dans `src/server/children.ts`).

- Cliquer sur une valeur la transforme en `<input type="number">` inline
- Confirmer avec **Entrée** ou **blur** → `setChildStat({ childId, field, value })` (`src/server/children.ts`)
- Si la valeur n'a pas changé, aucun appel serveur
- Icônes de série : `getStreakLevel()` depuis `src/lib/streak.ts`
```

- [ ] **Step 2 : Commit**

```bash
git add docs/parents.md
git commit -m "docs: document child stats editor section in parent dashboard"
```

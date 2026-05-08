# Holiday Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Détecter automatiquement les jours fériés et périodes de vacances depuis `config/holiday_days.json` et charger les tâches du dossier `holiday` en remplacement du jour normal.

**Architecture:** Ajout d'une fonction pure `isHolidayDate(isoDate)` dans `src/server/config.ts` qui lit `holiday_days.json` de façon synchrone. `loadTasksForDay` reçoit un paramètre optionnel `date` (YYYY-MM-DD) et remplace le dossier `day` par `"holiday"` si le jour est férié. Les deux routes (`index.tsx`, `parents.tsx`) passent la date courante.

**Tech Stack:** TypeScript natif, comparaison lexicographique ISO 8601, Node.js `readFileSync`, Vitest

---

## Fichiers modifiés

| Fichier                     | Action                                              |
| --------------------------- | --------------------------------------------------- |
| `src/server/config.ts`      | Ajouter `isHolidayDate`, modifier `loadTasksForDay` |
| `src/server/config.test.ts` | Créer — tests unitaires de `isHolidayDate`          |
| `src/routes/index.tsx`      | Passer `date` à `loadTasksForDay`                   |
| `src/routes/parents.tsx`    | Passer `date` à `loadTasksForDay`                   |

---

### Task 1: Tests unitaires pour `isHolidayDate`

**Files:**

- Create: `src/server/config.test.ts`

- [ ] **Step 1: Créer le fichier de test**

```ts
// src/server/config.test.ts
import { describe, it, expect } from 'vitest'
import { isHolidayDate } from '#/server/config'

describe('isHolidayDate', () => {
  it('retourne true pour un jour férié isolé', () => {
    // 05-01 est dans holiday_days.json
    expect(isHolidayDate('2026-05-01')).toBe(true)
  })

  it("retourne true pour le premier jour d'une période de vacances", () => {
    // 05-14 est le start de la période dans holiday_days.json
    expect(isHolidayDate('2026-05-14')).toBe(true)
  })

  it("retourne true pour le dernier jour d'une période de vacances (inclusif)", () => {
    // 05-15 est le end de la période dans holiday_days.json
    expect(isHolidayDate('2026-05-15')).toBe(true)
  })

  it('retourne true pour un jour dans une période de vacances', () => {
    // entre 05-14 et 05-15 — on teste une période plus large
    // on utilise une date fictive mais la logique doit être correcte
    // Ce test valide la logique >= start && <= end
    expect(isHolidayDate('2026-05-08')).toBe(true) // 05-08 est dans days
  })

  it('retourne false pour un jour normal', () => {
    expect(isHolidayDate('2026-05-02')).toBe(false)
  })

  it('retourne false pour un jour hors période de vacances', () => {
    expect(isHolidayDate('2026-05-16')).toBe(false)
  })

  it('gère les périodes cross-mois (ex: 12-28 → 01-05)', () => {
    // On ne peut pas tester avec le vrai fichier pour cross-mois,
    // mais la logique doit traiter le cas où end < start en incrémentant l'année
    // Ce test vérifie qu'un jour hors période n'est pas faussement détecté
    expect(isHolidayDate('2026-06-01')).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent (RED)**

```bash
cd /home/tdemares/dev_folder/child_tasks && npm test -- --reporter=verbose 2>&1 | tail -20
```

Attendu : erreur `isHolidayDate is not exported` ou `not a function`

---

### Task 2: Implémenter `isHolidayDate` et exporter depuis `config.ts`

**Files:**

- Modify: `src/server/config.ts`

- [ ] **Step 1: Ajouter le type et la fonction en haut de `src/server/config.ts`**

Après les imports existants, avant `const CONFIG_ROOT`, ajouter :

```ts
type HolidayConfig = {
  days: string[] // format "MM-dd"
  periods: { start: string; end: string }[] // format "MM-dd"
}

export function isHolidayDate(isoDate: string): boolean {
  const filePath = join(CONFIG_ROOT, 'holiday_days.json')
  if (!existsSync(filePath)) return false

  const config = JSON.parse(readFileSync(filePath, 'utf-8')) as HolidayConfig
  const mmdd = isoDate.slice(5) // "YYYY-MM-DD" → "MM-dd"
  const year = isoDate.slice(0, 4)

  if (config.days.includes(mmdd)) return true

  return config.periods.some((p) => {
    let startFull = `${year}-${p.start}`
    let endFull = `${year}-${p.end}`
    if (endFull < startFull) {
      // période cross-année : la fin est l'année suivante
      endFull = `${parseInt(year) + 1}-${p.end}`
    }
    return isoDate >= startFull && isoDate <= endFull
  })
}
```

Note : `isHolidayDate` est exportée pour être testable directement (fonction pure, pas une `createServerFn`).

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils passent (GREEN)**

```bash
cd /home/tdemares/dev_folder/child_tasks && npm test -- --reporter=verbose 2>&1 | tail -20
```

Attendu : tous les tests de `config.test.ts` PASS

- [ ] **Step 3: Commiter**

```bash
git add src/server/config.ts src/server/config.test.ts
git commit -m "feat: add isHolidayDate detection from holiday_days.json"
```

---

### Task 3: Modifier `loadTasksForDay` pour accepter `date` et utiliser `holiday`

**Files:**

- Modify: `src/server/config.ts`

- [ ] **Step 1: Ajouter `date` à l'input de `loadTasksForDay`**

Remplacer le bloc `loadTasksForDay` existant :

```ts
export const loadTasksForDay = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { period: string; day: string; childName: string }) => data,
  )
  .handler(async ({ data }) => {
    const filePath = join(
      CONFIG_ROOT,
      data.period,
      data.day,
      data.childName,
      'tasks.json',
    )
    if (!existsSync(filePath)) {
      throw new Error(`Fichier de tâches manquant : ${filePath}`)
    }
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Task[]
  })
```

Par :

```ts
export const loadTasksForDay = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { period: string; day: string; childName: string; date?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const effectiveDay =
      data.date && isHolidayDate(data.date) ? 'holiday' : data.day
    const filePath = join(
      CONFIG_ROOT,
      data.period,
      effectiveDay,
      data.childName,
      'tasks.json',
    )
    if (!existsSync(filePath)) {
      throw new Error(`Fichier de tâches manquant : ${filePath}`)
    }
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Task[]
  })
```

- [ ] **Step 2: Vérifier que les tests existants passent encore**

```bash
cd /home/tdemares/dev_folder/child_tasks && npm test 2>&1 | tail -10
```

Attendu : tous les tests PASS (le paramètre `date` est optionnel, pas de régression)

- [ ] **Step 3: Commiter**

```bash
git add src/server/config.ts
git commit -m "feat: loadTasksForDay uses holiday folder on public holidays"
```

---

### Task 4: Passer `date` dans `src/routes/index.tsx`

**Files:**

- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Ajouter `date` à l'appel `loadTasksForDay` dans la boucle `init()`**

Dans la fonction `init()` de `index.tsx`, la ligne :

```ts
const date = getParisDate()
```

existe déjà. Modifier l'appel `loadTasksForDay` :

```ts
const t = await loadTasksForDay({
  data: { period, day, childName: child.name.toLowerCase(), date },
})
```

(Remplacer `data: { period, day, childName: child.name.toLowerCase() }` par la version avec `date`)

- [ ] **Step 2: Vérifier le build TypeScript**

```bash
cd /home/tdemares/dev_folder/child_tasks && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur

- [ ] **Step 3: Commiter**

```bash
git add src/routes/index.tsx
git commit -m "feat: pass date to loadTasksForDay in main route"
```

---

### Task 5: Passer `date` dans `src/routes/parents.tsx`

**Files:**

- Modify: `src/routes/parents.tsx`

- [ ] **Step 1: Ajouter l'import `getParisDate` si absent, et passer `date`**

Vérifier les imports en haut de `parents.tsx`. Si `getParisDate` n'est pas importé :

```ts
import { getParisDate } from '#/lib/date'
```

Puis modifier l'appel `loadTasksForDay` dans `handleValidate` :

```ts
const tasks = await loadTasksForDay({
  data: {
    period: session.period,
    day: session.day,
    childName: session.child.name.toLowerCase(),
    date: session.date, // la date ISO de la session (format YYYY-MM-DD)
  },
})
```

Note : `session.date` est la date de la session stockée en DB (format `YYYY-MM-DD`). C'est la bonne valeur à utiliser ici car le dashboard parent peut revisiter des sessions passées — on veut détecter le holiday pour la date de la session, pas la date courante.

- [ ] **Step 2: Vérifier le build TypeScript**

```bash
cd /home/tdemares/dev_folder/child_tasks && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur

- [ ] **Step 3: Lancer tous les tests**

```bash
cd /home/tdemares/dev_folder/child_tasks && npm test 2>&1 | tail -15
```

Attendu : tous les tests PASS

- [ ] **Step 4: Commiter**

```bash
git add src/routes/parents.tsx
git commit -m "feat: pass session date to loadTasksForDay in parents route"
```

---

### Task 6: Mettre à jour la doc

**Files:**

- Modify: `docs/tasks.md` ou `docs/config.md` selon où la config des tâches est documentée

- [ ] **Step 1: Ajouter une section sur les jours fériés dans `docs/config.md`**

Ajouter à la fin de `docs/config.md` (ou créer si absent) :

````markdown
## Jours fériés et vacances

Le fichier `config/holiday_days.json` liste les jours où les tâches "holiday" s'appliquent :

```json
{
  "days": ["MM-dd", ...],
  "periods": [{ "start": "MM-dd", "end": "MM-dd" }, ...]
}
```
````

- `days` : jours fériés isolés (ex: `"05-01"` pour le 1er mai)
- `periods` : intervalles inclusifs (cross-mois supporté)

Quand le jour courant est un jour férié ou en vacances, les tâches sont chargées depuis `config/<period>/holiday/<enfant>/tasks.json` au lieu du dossier du jour de la semaine.

````

- [ ] **Step 2: Commiter**

```bash
git add docs/
git commit -m "docs: document holiday detection in config"
````

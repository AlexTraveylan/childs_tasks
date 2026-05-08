# Design : Détection des jours fériés et vacances

**Date** : 2026-05-08  
**Status** : approuvé

## Contexte

L'application charge les tâches du jour depuis `config/<period>/<day>/<enfant>/tasks.json`. Les jours fériés et périodes de vacances nécessitent des tâches différentes, stockées dans `config/<period>/holiday/<enfant>/tasks.json`.

## Source de vérité

Fichier `config/holiday_days.json` :

```json
{
  "days": ["05-01", "05-08"],
  "periods": [{ "start": "05-14", "end": "05-15" }]
}
```

- `days` : liste de jours fériés isolés au format `MM-dd`
- `periods` : intervalles de vacances inclusifs au format `MM-dd` (peuvent être cross-mois)

## Logique de détection

Fonction `isHolidayDate(isoDate: string): boolean` dans `src/server/config.ts`.

- `isoDate` est au format `YYYY-MM-DD` (déjà produit par `getParisDate()`)
- On extrait `MM-dd` depuis `isoDate` pour matcher les `days`
- Pour les `periods`, on construit des dates complètes `YYYY-MM-DD` en réutilisant l'année courante pour la borne start, et en gérant le cross-année : si `end < start` (ex: `"12-28"` → `"01-05"`), on incrémente l'année de la borne `end`
- Comparaison lexicographique native (`isoDate >= start && isoDate <= end`) — aucune librairie nécessaire

## Modifications fichier par fichier

### `src/server/config.ts`

1. Ajouter la fonction `isHolidayDate(isoDate: string): boolean` (lecture synchrone de `holiday_days.json`)
2. Ajouter `date?: string` (format `YYYY-MM-DD`) au type d'input de `loadTasksForDay`
3. Si `date` fournie et `isHolidayDate(date)` → remplacer `data.day` par `"holiday"` dans la construction du chemin

### `src/lib/date.ts`

Aucune modification nécessaire — `getParisDate()` retourne déjà `YYYY-MM-DD`.

### `src/routes/index.tsx`

Passer `date: getParisDate()` aux appels `loadTasksForDay`.

### `src/routes/parents.tsx`

Passer `date: getParisDate()` aux appels `loadTasksForDay` (le dashboard parent peut aussi afficher un jour précis — si le jour est passé en paramètre, utiliser ce `date` explicite).

## Gestion cross-mois dans les périodes

```ts
// Exemple : period { start: "12-28", end: "01-05" }
const year = isoDate.slice(0, 4) // "2025"
let startFull = `${year}-${p.start}`
let endFull = `${year}-${p.end}`
if (endFull < startFull) {
  // période cross-année : end est l'année suivante
  endFull = `${parseInt(year) + 1}-${p.end}`
}
return isoDate >= startFull && isoDate <= endFull
```

Aucune lib de dates requise — comparaison ISO lexicographique native TypeScript/JS.

## Ce qui ne change pas

- `validateAndSyncConfig` : valide uniquement les 7 dossiers nommés, pas `holiday`
- Structure des fichiers de tâches holiday : même format `Task[]` que les autres jours
- Aucune migration DB nécessaire

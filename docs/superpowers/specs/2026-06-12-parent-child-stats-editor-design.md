# Design — Éditeur de stats enfants (espace parent)

**Date :** 2026-06-12  
**Statut :** Approuvé

## Contexte

L'espace parent (`/parents`) permet de valider les sessions et gérer les achats. On ajoute une section en bas de page qui affiche les points et la série de chaque enfant, directement éditables par le parent.

## Fonctionnalité

### Placement

Section ajoutée tout en bas de la page `/parents`, après la section historique des achats.

### Affichage

Une carte par enfant (`Agathe`, `Maxence`) affichant :

- **Points** : icône 🏆 + valeur numérique
- **Série** : icône de palier (via `getStreakLevel`) + valeur numérique

### Interaction d'édition

- La valeur s'affiche comme du texte cliquable
- Un clic la transforme en `<input type="number" min={0}>`
- Confirmation sur **Entrée** ou **blur** :
  - Si la valeur a changé → appel `setChildStat` → rechargement des données
  - Si la valeur n'a pas changé → aucun appel serveur
- Le champ revient en mode texte après confirmation

## Architecture

### Données

La fonction `loadData()` existante dans `parents.tsx` est étendue pour appeler aussi `getChildrenStats()`.

**Nouvelle server function `getChildrenStats`** dans `src/server/children.ts` (nouveau fichier) :

```ts
getChildrenStats() → { id: number, name: string, points: number, streak: number }[]
// via prisma.child.findMany({ orderBy: { name: 'asc' } })
```

### Mutation

**Nouvelle server function `setChildStat`** :

```ts
setChildStat({ childId: number, field: 'points' | 'streak', value: number })
→ prisma.child.update({ where: { id: childId }, data: { [field]: value } })
```

Pas de validation supplémentaire : la page est protégée par mot de passe parent.

### Icônes de série

Utilise `getStreakLevel(streak)` depuis `src/lib/streak.ts` pour afficher l'icône de palier :

| Palier | Icône      |
| ------ | ---------- |
| 0      | _(aucune)_ |
| 1–4    | 🌱         |
| 5–9    | ⚡         |
| 10–14  | ⭐         |
| 15–19  | 🌟         |
| 20+    | 🔥         |

## Composants

Tout dans `parents.tsx` (pas de nouveau composant dédié — la section est simple). L'état d'édition local (`editingField: { childId, field } | null`) est géré avec `useState`.

## Fichiers impactés

| Fichier                            | Changement                                    |
| ---------------------------------- | --------------------------------------------- |
| `src/server/children.ts` (nouveau) | Ajout de `getChildrenStats` et `setChildStat` |
| `src/routes/parents.tsx`           | Extension de `loadData`, ajout section UI     |
| `docs/parents.md`                  | Mise à jour de la doc                         |

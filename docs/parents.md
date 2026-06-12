# Feature : Dashboard parent

## Route

`/parents` — `src/routes/parents.tsx`

## Composant

- `src/components/ParentPasswordGate.tsx` — wrapper de protection par mot de passe

## Accès

Le parent entre son mot de passe → vérifié via `verifyParentPassword()` (`src/server/auth.ts`).
Voir [auth.md](auth.md) pour la gestion du mot de passe.

## Sections

### 1. Validation des sessions

Server functions : `getPendingSessions()` + `validateSession()` dans `src/server/sessions.ts`

- Affiche les sessions non validées avec les tâches cochées et leurs timestamps
- Le parent choisit : **Honnête** (points calculés) ou **Triche** (0 point)
- Le calcul de points tient compte des deadlines → voir [tasks.md](tasks.md)

### 2. Récompenses à accomplir

Server functions : `getPendingPurchases()` + `markPurchaseDone()` dans `src/server/purchases.ts`

- Affiche ce que chaque enfant a acheté et pas encore reçu
- Le parent clique "Accompli" → `markPurchaseDone()` avec timestamp

### 3. Historique

Server function : `getPurchaseHistory()` dans `src/server/purchases.ts`

- Affiche les achats déjà accomplis avec dates d'achat et d'accomplissement

### 4. Scores des enfants

Affiche les points et la série actuels de chaque enfant (`getChildren()` dans `src/server/children.ts`).

- Cliquer sur une valeur la transforme en `<input type="number">` inline
- Confirmer avec **Entrée** ou **blur** → `setChildStat({ childId, field, value })` (`src/server/children.ts`)
- Si la valeur n'a pas changé, aucun appel serveur
- Icônes de série : `getStreakLevel()` depuis `src/lib/streak.ts`

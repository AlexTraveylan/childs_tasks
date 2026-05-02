# Feature : Récompenses

## Route

`/recompenses` — `src/routes/recompenses.tsx`

## Composant

- `src/components/RewardCard.tsx` — carte récompense avec sélecteur de quantité et dialog de confirmation

## Server functions (`src/server/purchases.ts`)

- `createPurchase({ childId, reward, quantity })` — vérifie les points, déduit le coût, crée l'achat (transaction atomique)
- `getPendingPurchases()` — achats non encore accomplis (avec info enfant)
- `getPurchaseHistory()` — achats accomplis
- `markPurchaseDone({ purchaseId })` — marque un achat comme accompli

## Config récompenses

`config/rewards.json` — chargé via `loadRewards()` dans `src/server/config.ts`

### Mode `quantity` — acheté en unités

```json
{
  "key": "screen-time",
  "label": "Temps d'écran",
  "mode": "quantity",
  "costPerUnit": 1,
  "unitValue": 5,
  "unit": "min",
  "emoji": "📱"
}
```

→ 1 point = 5 minutes d'écran

### Mode `unique` — acheté en un seul exemplaire

```json
{
  "key": "dessert-extra",
  "label": "Dessert bonus",
  "mode": "unique",
  "cost": 5,
  "emoji": "🍰"
}
```

## Types (`src/lib/config.ts`)

```typescript
type RewardQuantity = {
  key
  label
  mode: 'quantity'
  costPerUnit
  unitValue
  unit
  emoji?
}
type RewardUnique = { key; label; mode: 'unique'; cost; emoji? }
type Reward = RewardQuantity | RewardUnique
```

## Modèle DB : Purchase

| Champ       | Description                  |
| ----------- | ---------------------------- |
| `rewardKey` | Clé de la récompense         |
| `cost`      | Points dépensés              |
| `quantity`  | Nombre d'unités achetées     |
| `unitValue` | Valeur par unité (ex: 5 min) |
| `unitLabel` | Libellé unité (ex: "min")    |
| `isDone`    | Accomplie ou non             |
| `doneAt`    | Date d'accomplissement       |

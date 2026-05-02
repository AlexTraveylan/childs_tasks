# Système de configuration

## Server function

`src/server/config.ts`

- `validateAndSyncConfig()` — vérifie la structure du dossier `config/` et synchronise les enfants en DB. Appelé au démarrage de la page principale.
- `loadTasksForDay({ period, day, childName })` — charge `config/<period>/<day>/<childName>/tasks.json`
- `loadRewards()` — charge `config/rewards.json`

## Structure du dossier `config/`

```
config/
├── rewards.json
├── matin/
│   ├── lundi/
│   │   ├── agathe/tasks.json
│   │   └── maxence/tasks.json
│   ├── mardi/...
│   ├── mercredi/...
│   ├── jeudi/...
│   ├── vendredi/...
│   ├── samedi/...
│   └── dimanche/...
└── soir/
    └── (même structure que matin)
```

**Règles :**

- Exactement 2 enfants par dossier jour/période
- Les noms de dossiers enfants = noms en DB = `agathe` et `maxence`
- Jours en français minuscule : `lundi`, `mardi`, `mercredi`, `jeudi`, `vendredi`, `samedi`, `dimanche`

## Types (`src/lib/config.ts`)

```typescript
type Task = { label: string; deadline: string } // deadline: "HH:MM" Europe/Paris

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

## Ajouter ou modifier des tâches

Éditer directement le fichier `config/<period>/<jour>/<enfant>/tasks.json`. Aucune migration DB nécessaire.

## Ajouter un enfant

1. Créer les dossiers `config/matin/<jour>/<nouvel_enfant>/` et `config/soir/<jour>/<nouvel_enfant>/` pour chaque jour
2. Ajouter `tasks.json` dans chaque dossier
3. `validateAndSyncConfig()` créera automatiquement l'entrée en DB au prochain démarrage

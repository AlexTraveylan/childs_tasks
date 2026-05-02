# Utilitaires date/heure

## Fichier

`src/lib/date.ts` — toutes les fonctions utilisent la timezone **Europe/Paris**.

## Fonctions

| Fonction                         | Retour              | Description                                         |
| -------------------------------- | ------------------- | --------------------------------------------------- |
| `getParisDate()`                 | `"YYYY-MM-DD"`      | Date du jour à Paris                                |
| `getParisPeriod()`               | `"matin" \| "soir"` | Période selon l'heure (matin: 6h–14h, soir: 14h–0h) |
| `getParisDayName()`              | `"lundi"` etc.      | Nom du jour en français minuscule                   |
| `getParisTimeLabel()`            | `"HH:MM"`           | Heure actuelle Paris                                |
| `getParisDateLabel()`            | `"lundi 3 juin"`    | Date lisible en français                            |
| `isPastDeadline(deadline)`       | `boolean`           | Deadline `"HH:MM"` dépassée ?                       |
| `minutesUntilDeadline(deadline)` | `number`            | Minutes restantes avant deadline                    |
| `formatParisTime(isoString)`     | `"HH:MM"`           | Formate une date ISO en heure Paris                 |

## Usage

```typescript
import { getParisDate, getParisPeriod, isPastDeadline } from '#/lib/date'
```

## Note

La détection de période est utilisée dans le store (`taskStore.ts`) pour reset automatiquement les completions quand on change de période ou de jour.

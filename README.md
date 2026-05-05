# Child Tasks

Application de suivi des tâches et récompenses pour Agathe et Maxence.

## Stack

React 19 · TanStack Start · Prisma · SQLite · Tailwind CSS · Shadcn UI

## Prérequis

- Node.js 20+
- npm

## Installation

```bash
npm install
cp .env.local.example .env.local
# Éditer .env.local avec les valeurs correctes
npm run db:push
npm run db:generate
```

## Lancer le projet

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Accès depuis un autre PC du réseau local (via WSL)

Par défaut, le serveur Vite écoute uniquement sur `localhost` dans WSL — il n'est pas accessible depuis les autres appareils du réseau. Voici comment y remédier.

### Étape 1 — Lancer Vite en mode réseau

```bash
npm run dev -- --host 0.0.0.0
```

Le serveur écoute maintenant sur toutes les interfaces réseau de WSL.

### Étape 2 — Créer le port forwarding Windows → WSL

Dans un terminal **PowerShell en administrateur** sur le PC Windows :

```powershell
# Récupérer l'IP de la VM WSL
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]

# Créer la règle de forwarding
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp

# Vérifier
netsh interface portproxy show all
```

### Étape 3 — Ouvrir le port dans le pare-feu Windows

Toujours en **PowerShell administrateur** :

```powershell
New-NetFirewallRule -DisplayName "WSL Dev Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Accès depuis les autres appareils

```
http://192.168.1.135:3000
```

> **Note** : l'IP WSL change à chaque redémarrage de Windows. Répéter l'étape 2 si le forwarding ne fonctionne plus (ou automatiser via une tâche planifiée au démarrage).

### Supprimer le forwarding (optionnel)

```powershell
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

## Générer le mot de passe parent

```bash
./scripts/generate-parent-password.sh "mon_mot_de_passe"
```

Copier la ligne `PARENT_PASSWORD_HASH=...` dans `.env.local`.

> Les `$` du hash bcrypt doivent être échappés en `\$` dans `.env.local` — le script le fait automatiquement.

## Réinitialiser la base de données

Si tu veux repartir de zéro (pendant le développement) :

```bash
rm dev.db
npm run db:push
```

Optionnel : si un fichier seed existe, tu peux aussi faire :

```bash
npm run db:seed
```

## Scripts

| Commande              | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Développement (port 3000)                |
| `npm run build`       | Build production                         |
| `npm run preview`     | Prévisualiser le build                   |
| `npm run test`        | Lancer les tests (Vitest)                |
| `npm run lint`        | Vérifier le code (ESLint)                |
| `npm run format`      | Formater le code (Prettier + ESLint fix) |
| `npm run check`       | Vérifier le formatage                    |
| `npm run db:push`     | Appliquer le schéma Prisma               |
| `npm run db:migrate`  | Créer une migration                      |
| `npm run db:generate` | Générer le client Prisma                 |
| `npm run db:studio`   | Ouvrir Prisma Studio (GUI DB)            |

## Documentation

Voir [`docs/index.md`](docs/index.md) pour la documentation complète du code.

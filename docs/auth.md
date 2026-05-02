# Authentification parent

## Server function

`src/server/auth.ts` — `verifyParentPassword(input: string): Promise<boolean>`

Compare le mot de passe saisi avec le hash bcrypt stocké dans `process.env.PARENT_PASSWORD_HASH`.

## Problème critique : les `$` dans `.env.local`

Les hash bcrypt contiennent des `$` (ex: `$2b$10$...`). Dans `.env.local`, chaque `$` **doit être échappé en `\$`**, sinon la variable est mal lue.

**Correct dans `.env.local` :**

```
PARENT_PASSWORD_HASH=\$2b\$10\$abc...
```

## Générer un nouveau mot de passe

```bash
./scripts/generate-parent-password.sh "mon_nouveau_mot_de_passe"
```

Le script génère le hash et échappe automatiquement les `$`. Copier la ligne `PARENT_PASSWORD_HASH=...` dans `.env.local`.

## Mot de passe actuel

Voir le `.env.local` — ne pas stocker le mot de passe en clair ici.

#!/bin/bash
# Script pour générer le hash bcrypt du mot de passe parent
# et l'échapper correctement pour le .env.local

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <mot_de_passe>"
  echo ""
  echo "Exemple: $0 monMotDePasse"
  exit 1
fi

PASSWORD="$1"

# Vérifier que node/bcrypt est dispo
if ! command -v node &> /dev/null; then
  echo "Erreur: node n'est pas installé"
  exit 1
fi

# Générer le hash bcrypt depuis le répertoire du projet
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HASH=$(cd "$SCRIPT_DIR" && node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash(process.argv[1], 10).then(h => process.stdout.write(h));
" "$PASSWORD" 2>/dev/null)

if [ -z "$HASH" ]; then
  echo "Erreur: impossible de générer le hash. Vérifiez que bcrypt ou bcryptjs est installé."
  exit 1
fi

# Échapper les $ pour le .env.local (chaque $ devient \$)
ESCAPED_HASH=$(echo "$HASH" | sed 's/\$/\\$/g')

echo ""
echo "Hash généré : $HASH"
echo ""
echo "Ligne à mettre dans .env.local :"
echo "PARENT_PASSWORD_HASH=$ESCAPED_HASH"
echo ""
echo "Pour mettre à jour automatiquement le .env.local :"
echo "  sed -i 's|^PARENT_PASSWORD_HASH=.*|PARENT_PASSWORD_HASH=$ESCAPED_HASH|' .env.local"

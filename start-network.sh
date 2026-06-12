#!/bin/bash
# Lance l'application sur le réseau local
# Accessible depuis : http://192.168.1.115:3000

cd "$(dirname "$0")"

HOST="0.0.0.0"
PORT=3000

echo ""
echo "  Démarrage de Child Tasks sur le réseau local..."
echo ""
echo "  Accès local    : http://localhost:$PORT"
echo "  Accès réseau   : http://192.168.1.115:$PORT"
echo ""
echo "  (Ctrl+C pour arrêter)"
echo ""

dotenv -e .env.local -- ./node_modules/.bin/vite dev --host "$HOST" --port "$PORT"

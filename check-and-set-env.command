#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

cd "$HOME/cleo-app" || exit 1

echo "🔍 Vérification de l'authentification Netlify..."
echo ""

# Check netlify status
STATUS=$(netlify status 2>&1)
echo "$STATUS"
echo ""

if echo "$STATUS" | grep -qi "email\|logged in\|Current user"; then
  echo "✅ Déjà connecté ! Import des variables..."
  echo ""
  netlify env:import --file .env.netlify --site merci-cleo --force
  echo ""
  echo "✅ Variables importées !"
else
  echo "⚠️  Pas connecté. Connexion en cours..."
  netlify login
  echo ""
  echo "Reconnexion après auth..."
  netlify env:import --file .env.netlify --site merci-cleo --force
fi

echo ""
echo "📋 Variables actuelles :"
netlify env:list --site merci-cleo 2>&1 | head -20

echo ""
read -rp "Entrée pour fermer..."

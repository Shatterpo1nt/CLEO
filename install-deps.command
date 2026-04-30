#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

cd "$HOME/cleo-app" || { echo "❌ ~/cleo-app introuvable"; exit 1; }

echo "📦 Installation des dépendances Supabase + Stripe..."
npm install

echo ""
echo "✅ Done — tu peux fermer ce terminal."
read -rp "Entrée pour fermer..."

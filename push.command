#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

cd "$HOME/cleo-app" || { echo "❌ ~/cleo-app introuvable"; exit 1; }

git add .
git commit -m "feat: Supabase + Stripe integration (auth, checkout, webhooks, homepage)"
git push origin HEAD

echo ""
echo "✅ Pushé — Netlify build en cours..."
read -rp "Entrée pour fermer..."

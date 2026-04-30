#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
export NETLIFY_AUTH_TOKEN="nfp_Tz79u96DfR4vesgfC7nBjFFojXFrR5v11b73"

cd "$HOME/cleo-app" || exit 1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLÉO — Configuration Netlify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 Vérification du token..."
STATUS=$(netlify status 2>&1)
if ! echo "$STATUS" | grep -qi "Email:"; then
  echo "❌ Token invalide :"
  echo "$STATUS"
  read -rp "Entrée pour fermer..."
  exit 1
fi
echo "✅ Authentifié !"
echo ""

set_var() {
  local KEY=$1
  local VAL=$2
  local RESULT
  RESULT=$(netlify env:set "$KEY" "$VAL" --site merci-cleo 2>&1)
  if echo "$RESULT" | grep -qi "error\|unauthorized\|not found"; then
    echo "  ❌ $KEY — $RESULT"
  else
    echo "  ✅ $KEY"
  fi
}

echo "🌐 Supabase..."
set_var "NEXT_PUBLIC_SUPABASE_URL" "https://itatnqszypbbmvnsuvxk.supabase.co"
set_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YXRucXN6eXBiYm12bnN1dnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NjA3NDUsImV4cCI6MjA5MzEzNjc0NX0.I9ip4VdtRKz32AohLSRskZqU58A5skUBwJMsZ3A4AV0"
set_var "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YXRucXN6eXBiYm12bnN1dnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU2MDc0NSwiZXhwIjoyMDkzMTM2NzQ1fQ.zpabvKpC7zXXqcxkw_vhvUynkcMlex5aLLLUT-FGIak"

echo ""
echo "💳 Stripe..."
set_var "STRIPE_SECRET_KEY" "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"
set_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_live_51RIXJ1K1Syv6ozxcg0IiQWQ6GpyMZieMPcQoUAd5HSl4pm2oqtbx295HE0xYDgqwbKfJiEgNjrlMt2XQpzu0myBZ00KKhp69ce"
set_var "STRIPE_PRICE_MONTHLY" "price_1TRzSKK1Syv6ozxcH30xOkoT"
set_var "STRIPE_PRICE_ANNUAL" "price_1TRzSLK1Syv6ozxcWT7pzIeP"

echo ""
echo "🌍 Site URL..."
set_var "NEXT_PUBLIC_SITE_URL" "https://merci-cleo.fr"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Résultat final :"
netlify env:list --site merci-cleo 2>&1
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Terminé ! Prochaine étape : créer le webhook Stripe."
echo ""
read -rp "Entrée pour fermer..."

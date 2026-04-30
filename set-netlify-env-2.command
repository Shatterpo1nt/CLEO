#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "🔧 Configuration des variables d'environnement Netlify via API..."
echo ""

# Lire le token depuis le fichier de config Netlify CLI
CONFIG_FILE="$HOME/.config/netlify/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  CONFIG_FILE="$HOME/.netlify/config.json"
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Token Netlify introuvable. Lance set-netlify-env.command d'abord."
  read -rp "Entrée pour fermer..."
  exit 1
fi

TOKEN=$(node -e "
const cfg = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
const users = cfg.users;
const userId = Object.keys(users)[0];
console.log(users[userId]?.auth?.token || '');
" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Token introuvable dans $CONFIG_FILE"
  cat "$CONFIG_FILE" | head -20
  read -rp "Entrée pour fermer..."
  exit 1
fi

echo "✅ Token trouvé"

# Récupérer l'ID du site merci-cleo
SITE_ID=$(node -e "
const https = require('https');
const options = {
  hostname: 'api.netlify.com',
  path: '/api/v1/sites?filter=owner&name=merci-cleo',
  headers: {'Authorization': 'Bearer $TOKEN', 'Content-Type': 'application/json'}
};
let data = '';
https.get(options, res => {
  res.on('data', d => data += d);
  res.on('end', () => {
    const sites = JSON.parse(data);
    const site = Array.isArray(sites) ? sites.find(s => s.name === 'merci-cleo') : null;
    console.log(site ? site.id : '');
  });
});
" 2>/dev/null)

if [ -z "$SITE_ID" ]; then
  echo "❌ Site merci-cleo introuvable via API"
  read -rp "Entrée pour fermer..."
  exit 1
fi

echo "✅ Site ID: $SITE_ID"
echo ""

set_var() {
  local KEY=$1
  local VAL=$2
  echo "  → $KEY"
  node -e "
const https = require('https');
const body = JSON.stringify({key: '$KEY', values: [{value: '$VAL', context: 'all'}]});
const options = {
  hostname: 'api.netlify.com',
  path: '/api/v1/accounts/$(node -e "const cfg=JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8'));const uid=Object.keys(cfg.users)[0];const sites=cfg.users[uid]?.onBehalfOf;console.log(cfg.users[uid]?.slugs?.current||'')" 2>/dev/null)/env',
  method: 'POST',
  headers: {'Authorization': 'Bearer $TOKEN', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)}
};
const req = https.request(options, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => process.stdout.write(res.statusCode === 201 ? '' : 'ERR:'+res.statusCode+' '));
});
req.on('error', e => process.stdout.write('ERR:'+e.message+' '));
req.write(body);
req.end();
" 2>/dev/null
}

# Simpler: use netlify CLI which should now be authenticated
echo "🌐 Supabase..."
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://itatnqszypbbmvnsuvxk.supabase.co" --site "$SITE_ID" 2>&1 | tail -1
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YXRucXN6eXBiYm12bnN1dnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NjA3NDUsImV4cCI6MjA5MzEzNjc0NX0.I9ip4VdtRKz32AohLSRskZqU58A5skUBwJMsZ3A4AV0" --site "$SITE_ID" 2>&1 | tail -1
netlify env:set SUPABASE_SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YXRucXN6eXBiYm12bnN1dnhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU2MDc0NSwiZXhwIjoyMDkzMTM2NzQ1fQ.zpabvKpC7zXXqcxkw_vhvUynkcMlex5aLLLUT-FGIak" --site "$SITE_ID" 2>&1 | tail -1

echo ""
echo "💳 Stripe..."
netlify env:set STRIPE_SECRET_KEY "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" --site "$SITE_ID" 2>&1 | tail -1
netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "pk_live_51RIXJ1K1Syv6ozxcg0IiQWQ6GpyMZieMPcQoUAd5HSl4pm2oqtbx295HE0xYDgqwbKfJiEgNjrlMt2XQpzu0myBZ00KKhp69ce" --site "$SITE_ID" 2>&1 | tail -1
netlify env:set STRIPE_PRICE_MONTHLY "price_1TRzSKK1Syv6ozxcH30xOkoT" --site "$SITE_ID" 2>&1 | tail -1
netlify env:set STRIPE_PRICE_ANNUAL "price_1TRzSLK1Syv6ozxcWT7pzIeP" --site "$SITE_ID" 2>&1 | tail -1

echo ""
echo "🌍 Site URL..."
netlify env:set NEXT_PUBLIC_SITE_URL "https://merci-cleo.fr" --site "$SITE_ID" 2>&1 | tail -1

echo ""
echo "✅ Toutes les variables sont configurées !"
echo "⚠️  Il reste STRIPE_WEBHOOK_SECRET — à ajouter après création du webhook."
echo ""
read -rp "Entrée pour fermer..."

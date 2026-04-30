#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CLÉO — Création webhook Stripe"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

STRIPE_KEY="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"

echo "📡 Création du webhook endpoint..."
RESPONSE=$(curl -s https://api.stripe.com/v1/webhook_endpoints \
  -u "$STRIPE_KEY:" \
  -d "url=https://merci-cleo.fr/api/webhooks/stripe" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "enabled_events[]=invoice.payment_succeeded" \
  -d "enabled_events[]=invoice.payment_failed" \
  -d "description=Cléo production webhook")

echo ""

# Extract webhook secret
SECRET=$(echo "$RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'error' in d:
    print('ERROR: ' + d['error'].get('message', 'Unknown error'))
else:
    print('ID: ' + d.get('id', ''))
    print('SECRET: ' + d.get('secret', ''))
" 2>/dev/null)

echo "$SECRET"

if echo "$SECRET" | grep -q "ERROR:"; then
  echo ""
  echo "❌ Erreur. Réponse brute :"
  echo "$RESPONSE"
  read -rp "Entrée pour fermer..."
  exit 1
fi

WEBHOOK_SECRET=$(echo "$SECRET" | grep "SECRET:" | cut -d' ' -f2)

if [ -z "$WEBHOOK_SECRET" ]; then
  echo "❌ Secret non trouvé."
  echo "$RESPONSE"
  read -rp "Entrée pour fermer..."
  exit 1
fi

echo ""
echo "✅ Webhook créé !"
echo ""
echo "📋 Ajout de STRIPE_WEBHOOK_SECRET à Netlify..."

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
export NETLIFY_AUTH_TOKEN="nfp_Tz79u96DfR4vesgfC7nBjFFojXFrR5v11b73"

RESULT=$(netlify env:set STRIPE_WEBHOOK_SECRET "$WEBHOOK_SECRET" --site merci-cleo 2>&1)
if echo "$RESULT" | grep -qi "error\|unauthorized"; then
  echo "  ❌ $RESULT"
else
  echo "  ✅ STRIPE_WEBHOOK_SECRET"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Tout est configuré !"
echo ""
echo "STRIPE_WEBHOOK_SECRET = $WEBHOOK_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -rp "Entrée pour fermer..."

#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SK="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"

echo "🔧 Création des produits Stripe pour Cléo..."
echo ""

# ── Produit 1 : Cléo Mensuel ─────────────────────────────────────
echo "➡️  Création produit Cléo Mensuel..."
PROD_M=$(curl -s https://api.stripe.com/v1/products \
  -u "$SK:" \
  -d name="Cléo Mensuel" \
  -d description="Conservation sécurisée de clés · 2 récupérations/an · Résiliation à tout moment" \
  -d "metadata[plan_type]=monthly" \
  -d "metadata[included_key_retrievals_per_year]=2" \
  -d "metadata[first_month_free]=true" \
  -d "metadata[billing_interval]=month" \
  -d "metadata[physical_handover_included]=false")

PROD_M_ID=$(echo "$PROD_M" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id))")
echo "   Produit: $PROD_M_ID"

# Prix mensuel 15€ + 30j d'essai
echo "➡️  Création prix 15€/mois (30j d'essai)..."
PRICE_M=$(curl -s https://api.stripe.com/v1/prices \
  -u "$SK:" \
  -d product="$PROD_M_ID" \
  -d unit_amount=1500 \
  -d currency=eur \
  -d "recurring[interval]=month" \
  -d "recurring[trial_period_days]=30" \
  -d "metadata[plan_type]=monthly" \
  -d "metadata[first_month_free]=true")

PRICE_M_ID=$(echo "$PRICE_M" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id))")
echo "   ✅ Price mensuel: $PRICE_M_ID"
echo ""

# ── Produit 2 : Cléo Annuel ──────────────────────────────────────
echo "➡️  Création produit Cléo Annuel..."
PROD_A=$(curl -s https://api.stripe.com/v1/products \
  -u "$SK:" \
  -d name="Cléo Annuel" \
  -d description="Conservation sécurisée de clés · 2 récupérations/an · 1 remise en main propre offerte · Priorité créneaux dépôt" \
  -d "metadata[plan_type]=annual" \
  -d "metadata[included_key_retrievals_per_year]=2" \
  -d "metadata[first_month_free]=false" \
  -d "metadata[billing_interval]=year" \
  -d "metadata[physical_handover_included]=true" \
  -d "metadata[priority_deposit_slots]=true")

PROD_A_ID=$(echo "$PROD_A" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id))")
echo "   Produit: $PROD_A_ID"

# Prix annuel 150€ — sans essai
echo "➡️  Création prix 150€/an..."
PRICE_A=$(curl -s https://api.stripe.com/v1/prices \
  -u "$SK:" \
  -d product="$PROD_A_ID" \
  -d unit_amount=15000 \
  -d currency=eur \
  -d "recurring[interval]=year" \
  -d "metadata[plan_type]=annual" \
  -d "metadata[first_month_free]=false")

PRICE_A_ID=$(echo "$PRICE_A" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id))")
echo "   ✅ Price annuel: $PRICE_A_ID"
echo ""

# ── Résultat ─────────────────────────────────────────────────────
echo "════════════════════════════════════════"
echo "  COPIE CES VALEURS DANS NETLIFY :"
echo ""
echo "  STRIPE_PRICE_MONTHLY=$PRICE_M_ID"
echo "  STRIPE_PRICE_ANNUAL=$PRICE_A_ID"
echo "════════════════════════════════════════"
echo ""
read -rp "Entrée pour fermer..."

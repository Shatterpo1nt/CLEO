# Cléo — Parcours client & spécifications produit

> Document de référence avant implémentation.  
> Version : 01/05/2026  
> Statut : **Validé**

---

## Sommaire

1. [Parcours principal de souscription](#1-parcours-principal-de-souscription)
2. [Parcours si paiement abandonné](#2-parcours-si-paiement-abandonné)
3. [Parcours après paiement réussi](#3-parcours-après-paiement-réussi)
4. [Parcours dépôt initial](#4-parcours-dépôt-initial)
5. [Parcours sinistre / besoin ponctuel ou urgent](#5-parcours-sinistre--besoin-ponctuel-ou-urgent)
6. [Parcours restitution définitive / résiliation](#6-parcours-restitution-définitive--résiliation)
7. [Recommandation authentification](#7-recommandation-authentification)
8. [Statuts](#8-statuts)
9. [Données en base](#9-données-en-base)
10. [Fichiers concernés](#10-fichiers-concernés)
11. [Étapes de modification](#11-étapes-de-modification)
12. [Cas limites](#12-cas-limites)

---

## 1. Parcours principal de souscription

### Objectif
Convertir un visiteur en client abonné, avec dépôt de clé initié, en un minimum d'étapes.

### Contraintes
- Le paiement ne doit pas être précédé d'un magic link bloquant.
- La confirmation email est envoyée en parallèle, pas en prérequis.
- Aucune étape dashboard intermédiaire dans le parcours principal.

### Écrans

| Étape | URL | Description |
|---|---|---|
| 1 | `/` | Page d'accueil — présentation + CTA |
| 2 | `/inscription?plan=monthly` ou `?plan=annual` | Formulaire pré-paiement |
| 3 | Stripe Checkout (externe) | Paiement sécurisé |
| 4 | `/confirmation` | Page post-paiement, attente email |
| 5 | Email — magic link | "Accédez à votre espace Cléo" |
| 6 | `/auth/callback → /dashboard` | Dashboard avec abonnement actif |

### Flux détaillé

```
[/]  Page d'accueil
  ↓ Clic "Commencer" ou sélection formule

[/inscription?plan=monthly]
  Formulaire pré-paiement (voir section Données)

  Action serveur :
  → Création du compte Supabase (admin API, sans confirmation bloquante)
  → Envoi du magic link en parallèle
  → Sauvegarde profil dans user_profiles
  → Sauvegarde tentative dans souscriptions_en_attente
  → Création session Stripe Checkout (user_id en metadata)
  → Redirection immédiate vers Stripe

[Stripe Checkout]
  Paiement test : 4242 4242 4242 4242
  → Succès → /confirmation
  → Abandon → /inscription?plan=monthly&reprise=true

[/confirmation]
  "Votre paiement a été confirmé."
  "Vérifiez votre email pour accéder à votre espace Cléo."
  CTA : "Renvoyer l'email de connexion"

  En arrière-plan : webhook Stripe active l'abonnement

[Email → magic link]
  Objet : "Accédez à votre espace Cléo"
  ↓ Clic

[/auth/callback → /dashboard]
  Dashboard — abonnement actif
```

### CTA principaux

- `/` → `"Commencer"` / `"Mensuel — 15€/mois"` / `"Annuel — 150€/an"`
- `/inscription` → `"Continuer vers le paiement"`
- `/confirmation` → `"Renvoyer l'email de connexion"`

---

## 2. Parcours si paiement abandonné

### Objectif
Ne pas perdre un prospect qui a rempli le formulaire mais n'a pas finalisé le paiement.

### Écrans

| Étape | URL | Description |
|---|---|---|
| 1 | `/inscription` | Formulaire soumis, compte créé |
| 2 | Stripe Checkout | Ouvert mais abandonné |
| 3 | `/inscription?plan=...&reprise=true` | Retour avec données préremplies |
| 4 | `/dashboard` | Si l'utilisateur revient via magic link |

### Flux détaillé

```
[/inscription]  Formulaire soumis
  → Compte Supabase créé
  → Magic link envoyé
  → souscriptions_en_attente créée (stripe_session_id + converted_at = null)

[Stripe Checkout]  Abandon

Option A — L'utilisateur retente immédiatement
  → URL : /inscription?plan=monthly&reprise=true
  → Formulaire prérempli avec données connues
  → Nouvelle session Stripe créée

Option B — L'utilisateur revient plus tard via magic link
  → /auth/callback → /dashboard

[/dashboard]  État : abonné non payé

  ┌─ Abonnement ─────────────────────────────────────────┐
  │  Votre compte est créé.                               │
  │  Activez votre espace en choisissant une formule.     │
  │  [Mensuel — 15€/mois]   [Annuel — 150€/an]            │
  └───────────────────────────────────────────────────────┘
```

### CTA

- `/dashboard` (non payé) → `"Mensuel — 15€/mois"` | `"Annuel — 150€/an"`

### Données

- `souscriptions_en_attente.converted_at` reste `null` → permet recontact
- Ne pas créer de deuxième ligne si même email : upsert sur email

---

## 3. Parcours après paiement réussi

### Objectif
Afficher un dashboard cohérent avec l'abonnement actif et guider vers le dépôt de clé.

### Écrans

| Étape | URL | Description |
|---|---|---|
| 1 | `/dashboard` | Vue principale — abonnement + clé |
| 2 | `/dashboard/depot` | Initiation du dépôt de clé |

### Flux détaillé

```
[/dashboard]  Abonnement actif, aucune clé déposée

  ┌─ Abonnement ─────────────────────────────────────────┐
  │  ✓ Actif — Formule Mensuelle                          │
  │  Depuis le 01/05/2026                                  │
  │  Renouvellement le 01/06/2026                          │
  │  Récupérations incluses : 2 par an (0 utilisées)       │
  └───────────────────────────────────────────────────────┘

  ┌─ Ma clé ─────────────────────────────────────────────┐
  │  Statut : Aucune clé déposée                          │
  │                                                       │
  │  [Organiser le dépôt de ma clé →]                     │
  └───────────────────────────────────────────────────────┘
```

### CTA

- `"Organiser le dépôt de ma clé →"` → `/dashboard/depot`

### Règles d'affichage

- Ne jamais afficher "Aucun abonnement actif" si le paiement vient d'être confirmé.
- La mise à jour de statut est assurée par le webhook Stripe → `subscriptions.status = 'active'`.
- Si le webhook est en retard : afficher un état neutre "Abonnement en cours d'activation…" plutôt qu'un état incorrect.

---

## 4. Parcours dépôt initial

### Objectif
Permettre au client de choisir comment remettre sa clé, en 3 étapes simples.

### Contraintes
- Ne pas proposer l'envoi postal (responsabilité en cas de perte non couverte).
- Ne pas redemander les informations déjà connues (nom, téléphone, adresse).
- Données préremplies depuis `user_profiles`.

### Écrans

| Étape | URL | Description |
|---|---|---|
| 1 | `/dashboard/depot` | Étape 1 : mode de remise |
| 2 | `/dashboard/depot` | Étape 2 : infos complémentaires |
| 3 | `/dashboard/depot` | Étape 3 : confirmation |
| 4 | `/dashboard` | Retour — statut mis à jour |

### Flux détaillé

```
[/dashboard/depot]

  Étape 1 — Mode de remise
  "Comment souhaitez-vous nous remettre votre clé ?"

  ○ Je souhaite remettre ma clé en main propre
  ○ Je souhaite qu'un opérateur agréé vienne la récupérer
  ○ Je souhaite être recontacté pour organiser le dépôt

  ↓ Sélection → Suivant

  Étape 2 — Informations complémentaires
  (prérempli : nom, téléphone, adresse)
  - Nom ou label de la clé          (ex : "Appartement Paris 11e")
  - Nombre de clés
  - Instructions particulières
  - Créneaux disponibles
  - Lieu de remise si différent de l'adresse principale

  ↓ Valider

  Étape 3 — Confirmation
  Récapitulatif des informations saisies
  "Nous vous contacterons sous 48h pour confirmer le créneau."

  Statut clé → "Dépôt à organiser"
  → Retour /dashboard
```

### CTA

- Étape 1 : `"Suivant →"`
- Étape 2 : `"Valider"`
- Étape 3 : `"Revenir à mon espace"`

### Données créées / mises à jour

- `key_slots.status` → `depot_a_organiser`
- `key_slots.mode_depot` → `main_propre | operateur_agree | a_organiser`
- `key_slots.label`, `key_slots.nombre`, `key_slots.instructions`, `key_slots.lieu_remise_alternatif`

---

## 5. Parcours sinistre / besoin ponctuel ou urgent

### Objectif
Permettre au client de déclencher une intervention pour récupérer sa clé, selon un niveau d'urgence défini.

### Contexte
Ce n'est pas une résiliation. Le service continue après l'intervention. C'est le cas d'usage principal du produit.

### Exemples de cas
- Porte claquée, clés à l'intérieur
- Clés perdues temporairement
- Besoin ponctuel d'accès au logement
- Impossibilité d'accéder au logement

### Écrans

| Étape | URL | Description |
|---|---|---|
| 1 | `/dashboard` | CTA "J'ai besoin de ma clé" |
| 2 | `/dashboard/sinistre` | Étape 1 : niveau d'urgence |
| 3 | `/dashboard/sinistre` | Étape 2 : informations d'intervention |
| 4 | `/dashboard/sinistre` | Étape 3 : confirmation |
| 5 | `/dashboard` | Retour — statut mis à jour |

### Flux détaillé

```
[/dashboard]  Statut clé : "Clé stockée"
  CTA principal : [J'ai besoin de ma clé]
  ↓

[/dashboard/sinistre]

  Étape 1 — Niveau d'urgence
  "Quel est votre niveau d'urgence ?"

  ● Critique  — Je suis bloqué dehors maintenant
  ○ Urgent    — J'ai besoin de ma clé aujourd'hui
  ○ Planifié  — J'ai besoin de ma clé à une date précise

  ↓ Suivant

  Étape 2 — Informations d'intervention
  (prérempli : nom, téléphone, adresse)
  - Adresse de remise (si différente)
  - Téléphone joignable immédiatement
  - Personne qui récupère la clé
  - Créneau souhaité ("dès que possible" si Critique)
  - Contexte / commentaire libre

  ↓ Valider

  Étape 3 — Confirmation
  Récapitulatif + délai de prise en charge :
  - Critique  → "Nous vous rappelons dans les 30 minutes."
  - Urgent    → "Nous vous contactons dans les 2 heures."
  - Planifié  → "Nous confirmons votre créneau sous 24 heures."

  Note : récupérations utilisées : 1/2 cette année

  Statut clé → "Sinistre déclaré"
  → Retour /dashboard
```

### CTA

- `/dashboard` : `"J'ai besoin de ma clé"` (principal, visible si clé stockée)
- Étape 1 : `"Suivant →"`
- Étape 2 : `"Déclarer le sinistre"`
- Étape 3 : `"Revenir à mon espace"`

### Règles métier

- Le compteur `recovery_count_used` est incrémenté à la validation.
- Si `recovery_count_used >= 2` : afficher "Vous avez atteint votre quota annuel (2 récupérations). Contactez-nous pour toute demande complémentaire." — ne pas bloquer silencieusement.
- Si sinistre Critique hors heures d'ouverture : afficher un message de délai réaliste + numéro d'urgence si disponible.

---

## 6. Parcours restitution définitive / résiliation

### Objectif
Permettre au client de mettre fin à son abonnement et de récupérer sa clé de manière organisée.

### Contexte
Ce n'est pas une urgence. Ce parcours est distinct du sinistre. Il s'agit d'une démarche planifiée de fin de service.

### Écrans

| Étape | URL | Description |
|---|---|---|
| 1 | `/dashboard` | CTA discret "Résilier et récupérer ma clé" |
| 2 | `/dashboard/restitution` | Étape 1 : information + confirmation d'intention |
| 3 | `/dashboard/restitution` | Étape 2 : modalité de restitution |
| 4 | `/dashboard/restitution` | Étape 3 : créneau et identité |
| 5 | `/dashboard/restitution` | Étape 4 : confirmation finale |
| 6 | `/dashboard` | Retour — statut mis à jour |

### Flux détaillé

```
[/dashboard]  Statut clé : "Clé stockée"
  CTA secondaire (discret) : [Résilier et récupérer ma clé]
  ↓

[/dashboard/restitution]

  Étape 1 — Information + confirmation d'intention
  "Vous souhaitez mettre fin à votre abonnement Cléo et récupérer votre clé."
  "Cette démarche n'est pas urgente. Nous organiserons la restitution dans les meilleurs délais."

  [Continuer]

  Étape 2 — Modalité de restitution
  ○ Je récupère ma clé en main propre
  ○ Je souhaite qu'un opérateur agréé me la rapporte

  Étape 3 — Créneau et identité
  (prérempli : nom, adresse)
  - Créneau souhaité
  - Confirmation d'identité
  - Adresse de remise si différente

  Étape 4 — Confirmation finale
  "Votre demande de restitution définitive a été enregistrée."
  "Votre abonnement restera actif jusqu'au [date fin période]."
  "Nous vous contacterons pour confirmer le rendez-vous."

  Statut clé → "Restitution définitive demandée"
  Statut abonnement → inchangé jusqu'à fin de période
  → Retour /dashboard
```

### CTA

- `/dashboard` : `"Résilier et récupérer ma clé"` (secondaire, discret)
- Étape 1 : `"Continuer"`
- Étape 2–3 : `"Suivant →"`
- Étape 4 : `"Revenir à mon espace"`

### Règles métier

- Ne pas présenter ce parcours comme une urgence.
- L'abonnement n'est pas résilié immédiatement — il court jusqu'à la fin de la période en cours.
- Ne pas permettre une restitution définitive si un sinistre est en cours (statut `intervention_en_cours`). Afficher : "Une intervention est en cours. Veuillez attendre sa clôture avant de demander une restitution définitive."

---

## 7. Recommandation authentification

### Approche retenue : création silencieuse + magic link en parallèle

**Flux technique :**
1. Soumission du formulaire pré-paiement
2. Création du compte Supabase côté serveur via API admin (service role) — sans confirmation email bloquante
3. Envoi du magic link immédiatement à l'email saisi
4. Redirection directe vers Stripe Checkout
5. Après paiement, le webhook active l'abonnement
6. La page `/confirmation` invite à vérifier l'email
7. Le clic sur le magic link → `/auth/callback` → `/dashboard` avec abonnement actif

**Pour les connexions suivantes :**
Magic link uniquement (email → lien → dashboard). Pas de mot de passe.

**Wording côté utilisateur — à respecter impérativement :**

| ❌ Ne pas afficher | ✅ Afficher |
|---|---|
| "magic link" | "lien de connexion" |
| "Supabase" | (aucune mention) |
| "auth callback" | (aucune mention) |
| "Vérifiez vos emails" (tutoiement) | "Vérifiez votre adresse email" |
| "Connexion" (page login) | "Accédez à votre espace Cléo" |

**Email de magic link — objet et contenu :**
- Expéditeur : `Cléo <noreply@cleo.fr>` (à configurer dans Supabase → Auth → Email Templates)
- Objet : `"Accédez à votre espace Cléo"`
- Corps : simple, sans jargon technique

**Si magic link expiré :**
Page `/login` avec message neutre : "Entrez votre adresse email pour recevoir un lien de connexion." CTA : "Recevoir le lien".

---

## 8. Statuts

### Statuts clé (`key_slots.status`)

| Valeur | Libellé affiché |
|---|---|
| `aucune_deposee` | Aucune clé déposée |
| `depot_a_organiser` | Dépôt à organiser |
| `depot_planifie` | Dépôt planifié |
| `cle_recue` | Clé reçue |
| `cle_stockee` | Clé stockée |
| `sinistre_declare` | Sinistre déclaré |
| `intervention_en_cours` | Intervention en cours |
| `cle_remise_temporairement` | Clé remise temporairement |
| `cle_retournee` | Clé retournée au stockage |
| `restitution_def_demandee` | Restitution définitive demandée |
| `restitution_def_planifiee` | Restitution définitive planifiée |
| `cle_restituee` | Clé restituée définitivement |

### Statuts sinistre (`sinistres.status`)

| Valeur | Libellé affiché |
|---|---|
| `declare` | Sinistre déclaré |
| `qualification` | Qualification en cours |
| `planifie` | Intervention planifiée |
| `en_cours` | Intervention en cours |
| `cle_remise` | Clé remise |
| `cle_recuperee` | Clé récupérée / retour au stockage |
| `clos` | Sinistre clôturé |

### Statuts restitution définitive (`restitutions_definitives.status`)

| Valeur | Libellé affiché |
|---|---|
| `demandee` | Restitution demandée |
| `planifiee` | Restitution planifiée |
| `executee` | Clé restituée définitivement |

### Statuts abonnement (`subscriptions.status`)

Valeurs Stripe standard : `active`, `past_due`, `canceled`, `trialing`, `unpaid`.

---

## 9. Données en base

### Table `user_profiles` (nouvelle)

```sql
CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom          TEXT NOT NULL,
  nom             TEXT NOT NULL,
  telephone       TEXT,
  adresse         TEXT,
  ville           TEXT,
  code_postal     TEXT,
  type_logement   TEXT,
  cgv_accepted_at TIMESTAMPTZ,
  cgu_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);
```

### Table `souscriptions_en_attente` (nouvelle)

```sql
CREATE TABLE souscriptions_en_attente (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL,
  prenom            TEXT,
  nom               TEXT,
  telephone         TEXT,
  adresse           TEXT,
  ville             TEXT,
  code_postal       TEXT,
  type_logement     TEXT,
  plan              TEXT CHECK (plan IN ('monthly', 'annual')),
  stripe_session_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  converted_at      TIMESTAMPTZ,
  UNIQUE (email)
);
```

### Table `key_slots` (mise à jour)

```sql
-- Nouveaux champs à ajouter
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS nombre INTEGER DEFAULT 1;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS mode_depot TEXT
  CHECK (mode_depot IN ('main_propre', 'operateur_agree', 'a_organiser'));
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS lieu_remise_alternatif TEXT;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aucune_deposee'
  CHECK (status IN (
    'aucune_deposee', 'depot_a_organiser', 'depot_planifie',
    'cle_recue', 'cle_stockee', 'sinistre_declare', 'intervention_en_cours',
    'cle_remise_temporairement', 'cle_retournee',
    'restitution_def_demandee', 'restitution_def_planifiee', 'cle_restituee'
  ));
```

### Table `sinistres` (nouvelle)

```sql
CREATE TABLE sinistres (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id),
  key_slot_id         UUID REFERENCES key_slots(id),
  urgence             TEXT NOT NULL CHECK (urgence IN ('critique', 'urgent', 'planifie')),
  adresse_remise      TEXT,
  telephone_joignable TEXT,
  personne_remise     TEXT,
  creneau_souhaite    TEXT,
  contexte            TEXT,
  status              TEXT DEFAULT 'declare'
    CHECK (status IN (
      'declare', 'qualification', 'planifie',
      'en_cours', 'cle_remise', 'cle_recuperee', 'clos'
    )),
  created_at          TIMESTAMPTZ DEFAULT now(),
  closed_at           TIMESTAMPTZ
);
```

### Table `restitutions_definitives` (nouvelle)

```sql
CREATE TABLE restitutions_definitives (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id),
  key_slot_id      UUID REFERENCES key_slots(id),
  mode_restitution TEXT CHECK (mode_restitution IN ('main_propre', 'operateur_agree')),
  creneau_souhaite TEXT,
  adresse_remise   TEXT,
  status           TEXT DEFAULT 'demandee'
    CHECK (status IN ('demandee', 'planifiee', 'executee')),
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

### Table `subscriptions` (mise à jour)

```sql
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS recovery_count_used INTEGER DEFAULT 0;
```

---

## 10. Fichiers concernés

### Fichiers existants à modifier

| Fichier | Modification |
|---|---|
| `app/page.tsx` | Boutons CTA → `/inscription?plan=xxx` au lieu de checkout direct |
| `app/dashboard/page.tsx` | Refonte états, CTAs distincts sinistre / restitution |
| `app/api/webhooks/stripe/route.ts` | Fix admin client (priorité 1 — bloquant) |
| `lib/supabase/server.ts` | Ajouter `createAdminClientDirect` sans dépendance SSR/cookies |
| `app/api/health/route.ts` | Ajouter vérification `SUPABASE_SERVICE_ROLE_KEY` |
| `app/login/page.tsx` | Vouvoiement, wording sans jargon technique |

### Fichiers nouveaux à créer

| Fichier | Description |
|---|---|
| `app/inscription/page.tsx` | Formulaire pré-paiement |
| `app/api/inscription/route.ts` | Création compte + session Stripe |
| `app/confirmation/page.tsx` | Page post-paiement (attente email) |
| `app/dashboard/depot/page.tsx` | Workflow dépôt initial (3 étapes) |
| `app/dashboard/sinistre/page.tsx` | Déclaration sinistre (3 étapes) |
| `app/dashboard/restitution/page.tsx` | Restitution définitive (4 étapes) |

### Migrations SQL (Supabase)

| Fichier | Description |
|---|---|
| `supabase/migrations/001_user_profiles.sql` | Table `user_profiles` |
| `supabase/migrations/002_souscriptions_en_attente.sql` | Table `souscriptions_en_attente` |
| `supabase/migrations/003_key_slots_update.sql` | Mise à jour `key_slots` |
| `supabase/migrations/004_sinistres.sql` | Table `sinistres` |
| `supabase/migrations/005_restitutions_definitives.sql` | Table `restitutions_definitives` |
| `supabase/migrations/006_subscriptions_update.sql` | Ajout `recovery_count_used` |

---

## 11. Étapes de modification

### Étape 1 — Fix webhook Stripe → Supabase *(priorité 1, bloquant)*

**Problème actuel :** après paiement, `subscriptions.status` n'est pas mis à jour → dashboard affiche "Aucun abonnement actif".

**Actions :**
1. Vérifier l'URL du webhook dans Stripe Dashboard : doit pointer vers `/api/webhooks/stripe` (et non `/api/webhook` ou autre)
2. Vérifier la présence de `SUPABASE_SERVICE_ROLE_KEY` dans Netlify
3. Remplacer `createAdminClient()` (SSR) par un client Supabase admin direct (`@supabase/supabase-js`) dans le webhook — les cookies sont inutiles dans ce contexte
4. Ajouter `SUPABASE_SERVICE_ROLE_KEY` à la vérification du health check
5. Tester : paiement test → vérifier table `subscriptions` → dashboard doit afficher "Actif"

**Fichiers :** `app/api/webhooks/stripe/route.ts`, `lib/supabase/server.ts`, `app/api/health/route.ts`

---

### Étape 2 — Formulaire pré-paiement + création compte silencieuse

**Actions :**
1. Créer les migrations SQL (tables `user_profiles`, `souscriptions_en_attente`)
2. Créer `app/inscription/page.tsx` avec tous les champs requis + cases CGV/CGU/Confidentialité
3. Créer `app/api/inscription/route.ts` : crée l'utilisateur Supabase (admin), sauvegarde le profil, crée la session Stripe, retourne l'URL Stripe
4. Créer `app/confirmation/page.tsx` : page post-paiement avec CTA renvoi email
5. Modifier `app/page.tsx` : boutons → `/inscription?plan=xxx`

**Fichiers :** 3 nouveaux + 1 modifié + migrations

---

### Étape 3 — Dashboard cohérent post-paiement

**Actions :**
1. Refonte `app/dashboard/page.tsx` :
   - État "non payé" : CTA vers formules
   - État "actif, aucune clé" : CTA "Organiser le dépôt de ma clé"
   - État "actif, clé stockée" : CTA "J'ai besoin de ma clé" + CTA discret "Résilier et récupérer ma clé"
   - Affichage plan, dates, récupérations restantes
2. Ne jamais afficher "Aucun abonnement actif" si `status = active`

**Fichiers :** `app/dashboard/page.tsx`

---

### Étape 4 — Workflow dépôt initial

**Actions :**
1. Migration SQL `key_slots` mise à jour (statuts, mode_depot, label, etc.)
2. Créer `app/dashboard/depot/page.tsx` (3 étapes, données préremplies)

**Fichiers :** 1 nouveau + migration

---

### Étape 5 — Workflow sinistre

**Actions :**
1. Migration SQL table `sinistres`
2. Créer `app/dashboard/sinistre/page.tsx` (3 étapes : urgence, infos, confirmation)
3. Gestion du compteur `recovery_count_used`

**Fichiers :** 1 nouveau + migration

---

### Étape 6 — Workflow restitution définitive

**Actions :**
1. Migration SQL table `restitutions_definitives`
2. Créer `app/dashboard/restitution/page.tsx` (4 étapes)
3. Vérification : bloquer si sinistre `en_cours`

**Fichiers :** 1 nouveau + migration

---

### Étape 7 — Branding email + wording

**Actions :**
1. Supabase Dashboard → Auth → Email Templates → modifier nom expéditeur en "Cléo", personnaliser le corps
2. Uniformiser le vouvoiement dans tous les fichiers front-end
3. Supprimer tout jargon technique visible (magic link, Supabase, callback)

**Fichiers :** templates Supabase (UI) + `app/login/page.tsx` + `app/dashboard/page.tsx`

---

## 12. Cas limites

| Situation | Comportement attendu |
|---|---|
| Paiement réussi mais webhook Stripe échoue | Webhook en retry automatique (Stripe réessaie). Prévoir route admin de réconciliation manuelle. |
| Magic link expiré | Page `/login` avec renvoi. Message neutre, sans jargon. |
| Formulaire soumis deux fois avec le même email | Upsert sur `user_profiles` et `souscriptions_en_attente` — pas de doublon. |
| Abandon Stripe avec compte déjà créé | `souscriptions_en_attente.converted_at` reste `null`. L'utilisateur revient via magic link et voit le CTA de choix de formule. |
| Sinistre déclaré > 2 récupérations/an | Message visible : "Vous avez atteint votre quota annuel. Contactez-nous." Ne pas bloquer silencieusement. |
| Sinistre Critique hors heures d'ouverture | Message de délai réaliste + numéro d'urgence si disponible. Ne pas promettre 30 min sans garantie opérationnelle. |
| Changement d'adresse | Mise à jour `user_profiles` uniquement. Les `key_slots` conservent leur `lieu_remise_alternatif` distinct. |
| Restitution définitive demandée avec sinistre en cours | Bloquer avec message : "Une intervention est en cours. Attendez sa clôture avant de demander une restitution définitive." |
| Utilisateur avec plusieurs clés | Architecture multi-slots : chaque `key_slot` a son propre statut et ses propres sinistres. Le dashboard les liste séparément. |
| Abonnement `past_due` ou `unpaid` | Dashboard affiche un bandeau d'alerte : "Votre abonnement est en attente de paiement." CTAs sinistre et restitution désactivés. |

---

*Fin du document — version validée le 01/05/2026*

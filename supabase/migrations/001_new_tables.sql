-- ============================================================
-- CLÉO — Migrations v2
-- Run via run-migrations.command or paste in Supabase SQL editor
-- ============================================================

-- 1. TABLE user_profiles (profil étendu)
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom              TEXT NOT NULL,
  nom                 TEXT NOT NULL,
  telephone           TEXT,
  adresse             TEXT,
  ville               TEXT,
  code_postal         TEXT,
  type_logement       TEXT,
  cgv_accepted_at     TIMESTAMPTZ,
  cgu_accepted_at     TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own user_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own user_profile" ON user_profiles;

CREATE POLICY "Users can view own user_profile"
  ON user_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own user_profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. TABLE souscriptions_en_attente (prospects non convertis)
CREATE TABLE IF NOT EXISTS souscriptions_en_attente (
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

-- 3. TABLE key_slots — ajout colonnes manquantes
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS nombre INTEGER DEFAULT 1;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS mode_depot TEXT;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS lieu_remise_alternatif TEXT;
ALTER TABLE key_slots ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aucune_deposee';

-- Contrainte sur status key_slots
ALTER TABLE key_slots DROP CONSTRAINT IF EXISTS key_slots_status_check;
ALTER TABLE key_slots ADD CONSTRAINT key_slots_status_check CHECK (status IN (
  'aucune_deposee', 'depot_a_organiser', 'depot_planifie',
  'cle_recue', 'cle_stockee', 'sinistre_declare', 'intervention_en_cours',
  'cle_remise_temporairement', 'cle_retournee',
  'restitution_def_demandee', 'restitution_def_planifiee', 'cle_restituee'
));

-- Contrainte sur mode_depot
ALTER TABLE key_slots DROP CONSTRAINT IF EXISTS key_slots_mode_depot_check;
ALTER TABLE key_slots ADD CONSTRAINT key_slots_mode_depot_check CHECK (
  mode_depot IN ('main_propre', 'operateur_agree', 'a_organiser')
  OR mode_depot IS NULL
);

-- Initialiser status pour les slots existants
UPDATE key_slots SET status = 'aucune_deposee' WHERE status IS NULL;

-- Policy update pour key_slots
DROP POLICY IF EXISTS "Users can update own key slots" ON key_slots;
CREATE POLICY "Users can update own key slots"
  ON key_slots FOR UPDATE USING (auth.uid() = user_id);

-- 4. TABLE sinistres
CREATE TABLE IF NOT EXISTS sinistres (
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
    CHECK (status IN ('declare', 'qualification', 'planifie', 'en_cours', 'cle_remise', 'cle_recuperee', 'clos')),
  created_at          TIMESTAMPTZ DEFAULT now(),
  closed_at           TIMESTAMPTZ
);

ALTER TABLE sinistres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sinistres" ON sinistres;
DROP POLICY IF EXISTS "Users can insert own sinistres" ON sinistres;

CREATE POLICY "Users can view own sinistres"
  ON sinistres FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sinistres"
  ON sinistres FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. TABLE restitutions_definitives
CREATE TABLE IF NOT EXISTS restitutions_definitives (
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

ALTER TABLE restitutions_definitives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own restitutions" ON restitutions_definitives;
DROP POLICY IF EXISTS "Users can insert own restitutions" ON restitutions_definitives;

CREATE POLICY "Users can view own restitutions"
  ON restitutions_definitives FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own restitutions"
  ON restitutions_definitives FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. TABLE subscriptions — ajout recovery_count_used
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS recovery_count_used INTEGER DEFAULT 0;

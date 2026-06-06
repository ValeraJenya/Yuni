-- Yuni database schema draft.
-- PostgreSQL-first foundation; convert to ORM migrations when the backend stack is finalized.
-- UUID generation assumes pgcrypto. Likes active-overlap protection assumes btree_gist.
-- Enable extensions in real migrations if the target database does not have them.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'deleted')),
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_email_not_blank CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (lower(email));
CREATE INDEX users_status_idx ON users (status);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  device_label text,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason text,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refresh_tokens_token_hash_not_blank CHECK (length(trim(token_hash)) > 0),
  CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_active_idx ON refresh_tokens (user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  handle text NOT NULL,
  display_name text NOT NULL,
  birth_date date NOT NULL,
  bio text,
  gender text,
  looking_for text,
  city text,
  country text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_discoverable boolean NOT NULL DEFAULT true,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_handle_not_blank CHECK (length(trim(handle)) > 0),
  CONSTRAINT profiles_handle_format CHECK (handle ~ '^[a-zA-Z0-9_][a-zA-Z0-9_.-]{2,29}$'),
  CONSTRAINT profiles_display_name_not_blank CHECK (length(trim(display_name)) > 0),
  CONSTRAINT profiles_birth_date_reasonable CHECK (birth_date <= current_date)
);

CREATE UNIQUE INDEX profiles_handle_unique_idx ON profiles (lower(handle));
CREATE INDEX profiles_discoverable_idx ON profiles (is_discoverable, country, city);
CREATE INDEX profiles_location_idx ON profiles (country, city);

CREATE TABLE profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  public_url text,
  blurhash text,
  mime_type text,
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_primary boolean NOT NULL DEFAULT false,
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  rejected_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_photos_storage_key_not_blank CHECK (length(trim(storage_key)) > 0),
  CONSTRAINT profile_photos_storage_key_unique UNIQUE (storage_key),
  CONSTRAINT profile_photos_user_position_unique UNIQUE (user_id, position),
  CONSTRAINT profile_photos_published_requires_approval
    CHECK (published_at IS NULL OR moderation_status = 'approved')
);

CREATE INDEX profile_photos_user_id_idx ON profile_photos (user_id);
CREATE INDEX profile_photos_moderation_status_idx ON profile_photos (moderation_status);
CREATE UNIQUE INDEX profile_photos_one_primary_per_user_idx
  ON profile_photos (user_id)
  WHERE is_primary = true;
CREATE INDEX profile_photos_approved_primary_idx
  ON profile_photos (user_id)
  WHERE is_primary = true AND moderation_status = 'approved' AND published_at IS NOT NULL;

CREATE TABLE interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interests_name_unique UNIQUE (name),
  CONSTRAINT interests_slug_unique UNIQUE (slug)
);

CREATE TABLE profile_interests (
  profile_user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES interests(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_user_id, interest_id)
);

CREATE INDEX profile_interests_interest_id_idx ON profile_interests (interest_id);

CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'like'
    CHECK (kind IN ('like', 'superlike', 'pass')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT likes_no_self_like CHECK (liker_user_id <> liked_user_id),
  CONSTRAINT likes_expires_after_created CHECK (expires_at > created_at)
);

ALTER TABLE likes
  ADD CONSTRAINT likes_no_overlapping_active_interactions
  EXCLUDE USING gist (
    liker_user_id WITH =,
    liked_user_id WITH =,
    tstzrange(created_at, expires_at, '[)') WITH &&
  );

CREATE INDEX likes_liked_user_id_idx ON likes (liked_user_id, kind, expires_at);
CREATE INDEX likes_liker_liked_expires_idx ON likes (liker_user_id, liked_user_id, expires_at);
CREATE INDEX likes_liker_expires_idx ON likes (liker_user_id, expires_at);
CREATE INDEX likes_liker_user_id_idx ON likes (liker_user_id, created_at DESC);

CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'unmatched', 'blocked')),
  matched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_no_self_match CHECK (user_a_id <> user_b_id),
  CONSTRAINT matches_expires_after_matched CHECK (expires_at > matched_at)
);

CREATE UNIQUE INDEX matches_pair_unique_idx
  ON matches (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));
CREATE INDEX matches_user_a_idx ON matches (user_a_id, status);
CREATE INDEX matches_user_b_idx ON matches (user_b_id, status);
CREATE INDEX matches_active_expires_idx ON matches (expires_at)
  WHERE status = 'active';

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid UNIQUE REFERENCES matches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_match_id_idx ON conversations (match_id);

CREATE TABLE conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  last_read_message_id uuid,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX conversation_participants_user_id_idx
  ON conversation_participants (user_id, conversation_id);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT messages_body_not_blank CHECK (length(trim(body)) > 0),
  CONSTRAINT messages_sender_participant_fk
    FOREIGN KEY (conversation_id, sender_user_id)
    REFERENCES conversation_participants(conversation_id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX messages_conversation_created_idx
  ON messages (conversation_id, created_at DESC);
CREATE INDEX messages_sender_user_id_idx ON messages (sender_user_id);

ALTER TABLE conversation_participants
  ADD CONSTRAINT conversation_participants_last_read_message_fk
  FOREIGN KEY (last_read_message_id)
  REFERENCES messages(id)
  ON DELETE SET NULL;

CREATE TABLE blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocks_no_self_block CHECK (blocker_user_id <> blocked_user_id),
  CONSTRAINT blocks_pair_unique UNIQUE (blocker_user_id, blocked_user_id)
);

CREATE INDEX blocks_blocker_user_id_idx ON blocks (blocker_user_id);
CREATE INDEX blocks_blocked_user_id_idx ON blocks (blocked_user_id);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  profile_photo_id uuid REFERENCES profile_photos(id) ON DELETE SET NULL,
  reason_code text NOT NULL,
  comment text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_note text,
  CONSTRAINT reports_no_self_report CHECK (reporter_user_id <> reported_user_id),
  CONSTRAINT reports_reason_code_not_blank CHECK (length(trim(reason_code)) > 0),
  CONSTRAINT reports_reason_code_allowed CHECK (
    reason_code IN (
      'spam',
      'fake_profile',
      'harassment',
      'sexual_content',
      'hate_speech',
      'scam_or_money',
      'underage_suspected',
      'violence_or_threats',
      'other'
    )
  )
);

CREATE INDEX reports_reporter_user_id_idx ON reports (reporter_user_id);
CREATE INDEX reports_reported_user_id_idx ON reports (reported_user_id, status);
CREATE INDEX reports_status_created_idx ON reports (status, created_at);
CREATE INDEX reports_message_id_idx ON reports (message_id) WHERE message_id IS NOT NULL;
CREATE INDEX reports_profile_photo_id_idx ON reports (profile_photo_id) WHERE profile_photo_id IS NOT NULL;

CREATE TABLE privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_visibility_mode text NOT NULL DEFAULT 'open'
    CHECK (profile_visibility_mode IN ('open', 'private')),
  anonymous_avatar_key text,
  show_distance boolean NOT NULL DEFAULT true,
  show_online_status boolean NOT NULL DEFAULT false,
  show_display_name_in_private_mode boolean NOT NULL DEFAULT false,
  show_bio_in_private_mode boolean NOT NULL DEFAULT false,
  show_location_in_private_mode boolean NOT NULL DEFAULT false,
  discoverable boolean NOT NULL DEFAULT true,
  allow_messages_from_matches_only boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  likes_enabled boolean NOT NULL DEFAULT true,
  matches_enabled boolean NOT NULL DEFAULT true,
  messages_enabled boolean NOT NULL DEFAULT true,
  product_updates_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

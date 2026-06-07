-- Step 13: matches are expiring windows, not permanent pair decisions.
-- The greenfield baseline is intentionally left untouched.

CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Normalize existing rows before enforcing canonical pair order.
UPDATE "matches"
SET
  "user_a_id" = LEAST("user_a_id", "user_b_id"),
  "user_b_id" = GREATEST("user_a_id", "user_b_id")
WHERE "user_a_id" > "user_b_id";

ALTER TABLE "matches"
  ADD CONSTRAINT "matches_user_pair_order"
    CHECK ("user_a_id" < "user_b_id");

-- This real baseline index name was checked in the current migration history.
DROP INDEX IF EXISTS "matches_pair_unordered_unique_idx";

CREATE INDEX "matches_user_a_id_user_b_id_status_expires_at_idx"
  ON "matches"("user_a_id", "user_b_id", "status", "expires_at");

ALTER TABLE "matches"
  ADD CONSTRAINT "matches_no_overlapping_active_pairs"
  EXCLUDE USING gist (
    "user_a_id" WITH =,
    "user_b_id" WITH =,
    tstzrange("matched_at", "expires_at", '[)') WITH &&
  )
  WHERE ("status" = 'active');

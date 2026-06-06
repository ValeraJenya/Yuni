-- Step 12: likes are expiring interactions, not permanent pair decisions.
-- The greenfield baseline is intentionally left untouched.

CREATE EXTENSION IF NOT EXISTS "btree_gist";

ALTER TABLE "likes"
  ADD COLUMN "expires_at" TIMESTAMPTZ(6);

UPDATE "likes"
SET "expires_at" = CASE
  WHEN "kind" = 'pass' THEN "created_at" + INTERVAL '1 day'
  ELSE "created_at" + INTERVAL '3 days'
END
WHERE "expires_at" IS NULL;

ALTER TABLE "likes"
  ALTER COLUMN "expires_at" SET NOT NULL,
  ADD CONSTRAINT "likes_expires_after_created"
    CHECK ("expires_at" > "created_at");

DROP INDEX IF EXISTS "likes_liker_user_id_liked_user_id_key";
DROP INDEX IF EXISTS "likes_liked_user_id_kind_idx";

CREATE INDEX "likes_liked_user_id_kind_expires_at_idx"
  ON "likes"("liked_user_id", "kind", "expires_at");

CREATE INDEX "likes_liker_user_id_liked_user_id_expires_at_idx"
  ON "likes"("liker_user_id", "liked_user_id", "expires_at");

CREATE INDEX "likes_liker_user_id_expires_at_idx"
  ON "likes"("liker_user_id", "expires_at");

ALTER TABLE "likes"
  ADD CONSTRAINT "likes_no_overlapping_active_interactions"
  EXCLUDE USING gist (
    "liker_user_id" WITH =,
    "liked_user_id" WITH =,
    tstzrange("created_at", "expires_at", '[)') WITH &&
  );

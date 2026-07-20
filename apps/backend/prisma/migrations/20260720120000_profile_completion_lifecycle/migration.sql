UPDATE "profiles"
SET
  "bio" = NULLIF(BTRIM("bio"), ''),
  "gender" = NULLIF(BTRIM("gender"), ''),
  "looking_for" = NULLIF(BTRIM("looking_for"), ''),
  "city" = NULLIF(BTRIM("city"), ''),
  "country" = NULLIF(BTRIM("country"), '');

ALTER TABLE "profiles"
  DROP COLUMN "completed_at",
  ADD CONSTRAINT "profiles_bio_not_blank_if_set"
    CHECK ("bio" IS NULL OR LENGTH(BTRIM("bio")) > 0),
  ADD CONSTRAINT "profiles_gender_not_blank_if_set"
    CHECK ("gender" IS NULL OR LENGTH(BTRIM("gender")) > 0),
  ADD CONSTRAINT "profiles_looking_for_not_blank_if_set"
    CHECK ("looking_for" IS NULL OR LENGTH(BTRIM("looking_for")) > 0),
  ADD CONSTRAINT "profiles_city_not_blank_if_set"
    CHECK ("city" IS NULL OR LENGTH(BTRIM("city")) > 0),
  ADD CONSTRAINT "profiles_country_not_blank_if_set"
    CHECK ("country" IS NULL OR LENGTH(BTRIM("country")) > 0);

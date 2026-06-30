-- Review fixes for staged chat:
-- system transition messages have no user sender, and DB enforces the shape.

ALTER TABLE "messages"
  ADD COLUMN "is_system_message" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "messages"
  ALTER COLUMN "sender_user_id" DROP NOT NULL;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_system_sender_shape" CHECK (
    ("is_system_message" = true AND "sender_user_id" IS NULL)
    OR
    ("is_system_message" = false AND "sender_user_id" IS NOT NULL)
  );

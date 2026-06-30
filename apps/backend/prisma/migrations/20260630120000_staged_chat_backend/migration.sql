-- Staged chat backend: stages, games, starters, and voice accounting.

ALTER TABLE "conversations"
  ADD COLUMN "stage" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "stage1_started_at" TIMESTAMPTZ(6),
  ADD COLUMN "stage2_started_at" TIMESTAMPTZ(6),
  ADD COLUMN "stage3_started_at" TIMESTAMPTZ(6),
  ADD COLUMN "stage_updated_at" TIMESTAMPTZ(6),
  ADD COLUMN "user1_voice_total_sec" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "user2_voice_total_sec" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "conversations_stage_valid" CHECK ("stage" IN (1, 2, 3)),
  ADD CONSTRAINT "conversations_voice_totals_non_negative" CHECK ("user1_voice_total_sec" >= 0 AND "user2_voice_total_sec" >= 0);

UPDATE "conversations"
SET
  "stage1_started_at" = COALESCE("stage1_started_at", "created_at"),
  "stage_updated_at" = COALESCE("stage_updated_at", "created_at");

ALTER TABLE "messages"
  ADD COLUMN "voice_duration_sec" INTEGER,
  ADD COLUMN "message_weight" INTEGER NOT NULL DEFAULT 1,
  ADD CONSTRAINT "messages_voice_duration_non_negative" CHECK ("voice_duration_sec" IS NULL OR "voice_duration_sec" >= 0),
  ADD CONSTRAINT "messages_message_weight_positive" CHECK ("message_weight" >= 1);

CREATE TABLE "chat_games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "stage" INTEGER NOT NULL,
    "game_type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB,
    "shown_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "postponed_until" TIMESTAMPTZ(6),
    "postpone_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_games_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_games_stage_valid" CHECK ("stage" IN (1, 2, 3)),
    CONSTRAINT "chat_games_game_type_not_blank" CHECK (length(trim("game_type")) > 0),
    CONSTRAINT "chat_games_question_not_blank" CHECK (length(trim("question")) > 0),
    CONSTRAINT "chat_games_postpone_count_valid" CHECK ("postpone_count" >= 0 AND "postpone_count" <= 1)
);

CREATE TABLE "game_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "game_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_answers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_answers_answer_not_blank" CHECK (length(trim("answer")) > 0)
);

CREATE TABLE "conversation_starters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "conversation_starters_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conversation_starters_text_not_blank" CHECK (length(trim("text")) > 0)
);

CREATE UNIQUE INDEX "chat_games_conversation_id_question_key" ON "chat_games"("conversation_id", "question");
CREATE INDEX "chat_games_conversation_id_stage_completed_at_idx" ON "chat_games"("conversation_id", "stage", "completed_at");

CREATE UNIQUE INDEX "game_answers_game_id_user_id_key" ON "game_answers"("game_id", "user_id");
CREATE INDEX "game_answers_user_id_idx" ON "game_answers"("user_id");

CREATE INDEX "conversation_starters_is_active_idx" ON "conversation_starters"("is_active");

ALTER TABLE "chat_games" ADD CONSTRAINT "chat_games_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_answers" ADD CONSTRAINT "game_answers_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "chat_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_answers" ADD CONSTRAINT "game_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

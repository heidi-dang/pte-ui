-- Create enum types (safe: existing string values match enum values)
CREATE TYPE "QuestionStatus" AS ENUM ('draft', 'published', 'archived', 'rejected');
CREATE TYPE "QuestionSection" AS ENUM ('Speaking', 'Writing', 'Reading', 'Listening');
CREATE TYPE "QuestionDifficulty" AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE "QuestionSource" AS ENUM ('ai_original_deepseek', 'manual', 'imported');
CREATE TYPE "GenerationBatchStatus" AS ENUM ('queued', 'generating', 'validating', 'completed', 'partial_failed', 'failed');

-- Drop defaults first, then alter columns, then restore defaults
ALTER TABLE "QuestionBankItem" ALTER COLUMN "difficulty" DROP DEFAULT;
ALTER TABLE "QuestionBankItem" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "QuestionGenerationBatch" ALTER COLUMN "difficulty" DROP DEFAULT;
ALTER TABLE "QuestionGenerationBatch" ALTER COLUMN "status" DROP DEFAULT;

-- Alter QuestionBankItem columns with USING clause for safe cast
ALTER TABLE "QuestionBankItem" ALTER COLUMN "section" TYPE "QuestionSection" USING "section"::text::"QuestionSection";
ALTER TABLE "QuestionBankItem" ALTER COLUMN "difficulty" TYPE "QuestionDifficulty" USING "difficulty"::text::"QuestionDifficulty";
ALTER TABLE "QuestionBankItem" ALTER COLUMN "source" TYPE "QuestionSource" USING "source"::text::"QuestionSource";
ALTER TABLE "QuestionBankItem" ALTER COLUMN "status" TYPE "QuestionStatus" USING "status"::text::"QuestionStatus";

-- Alter QuestionGenerationBatch columns
ALTER TABLE "QuestionGenerationBatch" ALTER COLUMN "difficulty" TYPE "QuestionDifficulty" USING "difficulty"::text::"QuestionDifficulty";
ALTER TABLE "QuestionGenerationBatch" ALTER COLUMN "status" TYPE "GenerationBatchStatus" USING "status"::text::"GenerationBatchStatus";

-- Restore defaults
ALTER TABLE "QuestionBankItem" ALTER COLUMN "difficulty" SET DEFAULT 'medium'::"QuestionDifficulty";
ALTER TABLE "QuestionBankItem" ALTER COLUMN "status" SET DEFAULT 'draft'::"QuestionStatus";
ALTER TABLE "QuestionGenerationBatch" ALTER COLUMN "difficulty" SET DEFAULT 'medium'::"QuestionDifficulty";
ALTER TABLE "QuestionGenerationBatch" ALTER COLUMN "status" SET DEFAULT 'queued'::"GenerationBatchStatus";

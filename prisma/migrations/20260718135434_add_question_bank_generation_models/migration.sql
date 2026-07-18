-- CreateTable
CREATE TABLE "QuestionGenerationBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestKey" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL,
    "requestedCount" INTEGER NOT NULL DEFAULT 10,
    "readyCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuestionGenerationCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "rawOutputJson" TEXT,
    "normalizedPayload" TEXT,
    "validationJson" TEXT,
    "similarityScore" REAL,
    "qualityScore" INTEGER,
    "failureReason" TEXT,
    "questionBankItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionGenerationCandidate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "QuestionGenerationBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuestionBankItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskCode" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "promptHtml" TEXT,
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "passageText" TEXT,
    "optionsJson" TEXT,
    "answerKeyJson" TEXT,
    "sampleAnswer" TEXT,
    "explanation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "tagsJson" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "generationBatchId" TEXT,
    "generationSlot" INTEGER,
    "contentHash" TEXT,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending_review',
    "qualityScore" INTEGER,
    "validationJson" TEXT,
    "taskPayloadJson" TEXT,
    "assetStatus" TEXT NOT NULL DEFAULT 'not_required',
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "schemaVersion" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" DATETIME,
    "publishedAt" DATETIME,
    CONSTRAINT "QuestionBankItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuestionBankItem" ("answerKeyJson", "audioUrl", "createdAt", "createdByUserId", "difficulty", "explanation", "id", "imageUrl", "instruction", "optionsJson", "passageText", "promptHtml", "promptText", "sampleAnswer", "section", "source", "status", "tagsJson", "taskCode", "title", "updatedAt") SELECT "answerKeyJson", "audioUrl", "createdAt", "createdByUserId", "difficulty", "explanation", "id", "imageUrl", "instruction", "optionsJson", "passageText", "promptHtml", "promptText", "sampleAnswer", "section", "source", "status", "tagsJson", "taskCode", "title", "updatedAt" FROM "QuestionBankItem";
DROP TABLE "QuestionBankItem";
ALTER TABLE "new_QuestionBankItem" RENAME TO "QuestionBankItem";
CREATE INDEX "QuestionBankItem_taskCode_idx" ON "QuestionBankItem"("taskCode");
CREATE INDEX "QuestionBankItem_section_idx" ON "QuestionBankItem"("section");
CREATE INDEX "QuestionBankItem_status_idx" ON "QuestionBankItem"("status");
CREATE INDEX "QuestionBankItem_difficulty_idx" ON "QuestionBankItem"("difficulty");
CREATE INDEX "QuestionBankItem_generationBatchId_idx" ON "QuestionBankItem"("generationBatchId");
CREATE INDEX "QuestionBankItem_taskCode_reviewStatus_idx" ON "QuestionBankItem"("taskCode", "reviewStatus");
CREATE INDEX "QuestionBankItem_taskCode_status_difficulty_idx" ON "QuestionBankItem"("taskCode", "status", "difficulty");
CREATE UNIQUE INDEX "QuestionBankItem_taskCode_contentHash_key" ON "QuestionBankItem"("taskCode", "contentHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "QuestionGenerationBatch_requestKey_key" ON "QuestionGenerationBatch"("requestKey");

-- CreateIndex
CREATE INDEX "QuestionGenerationBatch_status_createdAt_idx" ON "QuestionGenerationBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionGenerationBatch_taskCode_status_idx" ON "QuestionGenerationBatch"("taskCode", "status");

-- CreateIndex
CREATE INDEX "QuestionGenerationCandidate_batchId_status_idx" ON "QuestionGenerationCandidate"("batchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionGenerationCandidate_batchId_slotNumber_key" ON "QuestionGenerationCandidate"("batchId", "slotNumber");

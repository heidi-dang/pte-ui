-- CreateTable
CREATE TABLE "PracticePlaybackConsumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playedCount" INTEGER NOT NULL DEFAULT 0,
    "firstPlayedAt" DATETIME,
    "lastPlayedAt" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "PracticePlaybackConsumption_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PracticeSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticePlaybackConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AudioMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "durationSec" REAL,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT,
    "questionId" TEXT,
    CONSTRAINT "AudioMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AudioMetadata_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AudioMetadata" ("attemptId", "byteSize", "createdAt", "durationSec", "hash", "id", "mimeType", "objectKey", "questionId", "userId") SELECT "attemptId", "byteSize", "createdAt", "durationSec", "hash", "id", "mimeType", "objectKey", "questionId", "userId" FROM "AudioMetadata";
DROP TABLE "AudioMetadata";
ALTER TABLE "new_AudioMetadata" RENAME TO "AudioMetadata";
CREATE UNIQUE INDEX "AudioMetadata_objectKey_key" ON "AudioMetadata"("objectKey");
CREATE INDEX "AudioMetadata_attemptId_questionId_idx" ON "AudioMetadata"("attemptId", "questionId");
CREATE TABLE "new_PracticeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "answerText" TEXT,
    "audioUrl" TEXT,
    "audioMetadataId" TEXT,
    "questionBankItemId" TEXT,
    "answerJson" TEXT,
    "transcript" TEXT,
    "transcriptProvider" TEXT,
    "transcriptConfidence" REAL,
    "score" INTEGER,
    "fluencyScore" INTEGER,
    "pronunciationScore" INTEGER,
    "feedback" TEXT,
    "grammarIssues" INTEGER,
    CONSTRAINT "PracticeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeSubmission_audioMetadataId_fkey" FOREIGN KEY ("audioMetadataId") REFERENCES "AudioMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PracticeSubmission" ("answerJson", "answerText", "audioUrl", "feedback", "fluencyScore", "grammarIssues", "id", "pronunciationScore", "questionBankItemId", "score", "section", "status", "submittedAt", "taskCode", "title", "userId") SELECT "answerJson", "answerText", "audioUrl", "feedback", "fluencyScore", "grammarIssues", "id", "pronunciationScore", "questionBankItemId", "score", "section", "status", "submittedAt", "taskCode", "title", "userId" FROM "PracticeSubmission";
DROP TABLE "PracticeSubmission";
ALTER TABLE "new_PracticeSubmission" RENAME TO "PracticeSubmission";
CREATE UNIQUE INDEX "PracticeSubmission_audioMetadataId_key" ON "PracticeSubmission"("audioMetadataId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PracticePlaybackConsumption_userId_idx" ON "PracticePlaybackConsumption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticePlaybackConsumption_submissionId_key" ON "PracticePlaybackConsumption"("submissionId");

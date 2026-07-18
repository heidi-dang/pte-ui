-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purpose" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "durationSec" REAL,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionBankItemId" TEXT,
    "questionVersion" INTEGER NOT NULL DEFAULT 1,
    "taskCode" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'timed',
    "status" TEXT NOT NULL DEFAULT 'In_Progress',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" DATETIME,
    "submittedAt" DATETIME,
    "questionSnapshotJson" TEXT NOT NULL,
    "scoringPolicyVersion" TEXT NOT NULL DEFAULT 'pte-estimated-v1',
    "playbackPolicySnapshotJson" TEXT,
    "responseAudioId" TEXT,
    CONSTRAINT "PracticeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeAttempt_responseAudioId_fkey" FOREIGN KEY ("responseAudioId") REFERENCES "AudioMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PracticePlaybackConsumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT,
    "attemptId" TEXT,
    "userId" TEXT NOT NULL,
    "playedCount" INTEGER NOT NULL DEFAULT 0,
    "firstPlayedAt" DATETIME,
    "lastPlayedAt" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "PracticePlaybackConsumption_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PracticeSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticePlaybackConsumption_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticePlaybackConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PracticePlaybackConsumption" ("firstPlayedAt", "id", "lastPlayedAt", "playedCount", "submissionId", "userId", "version") SELECT "firstPlayedAt", "id", "lastPlayedAt", "playedCount", "submissionId", "userId", "version" FROM "PracticePlaybackConsumption";
DROP TABLE "PracticePlaybackConsumption";
ALTER TABLE "new_PracticePlaybackConsumption" RENAME TO "PracticePlaybackConsumption";
CREATE INDEX "PracticePlaybackConsumption_userId_idx" ON "PracticePlaybackConsumption"("userId");
CREATE UNIQUE INDEX "PracticePlaybackConsumption_submissionId_key" ON "PracticePlaybackConsumption"("submissionId");
CREATE UNIQUE INDEX "PracticePlaybackConsumption_attemptId_key" ON "PracticePlaybackConsumption"("attemptId");
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
    "attemptId" TEXT,
    CONSTRAINT "PracticeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeSubmission_audioMetadataId_fkey" FOREIGN KEY ("audioMetadataId") REFERENCES "AudioMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticeSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PracticeSubmission" ("answerJson", "answerText", "audioMetadataId", "audioUrl", "feedback", "fluencyScore", "grammarIssues", "id", "pronunciationScore", "questionBankItemId", "score", "section", "status", "submittedAt", "taskCode", "title", "transcript", "transcriptConfidence", "transcriptProvider", "userId") SELECT "answerJson", "answerText", "audioMetadataId", "audioUrl", "feedback", "fluencyScore", "grammarIssues", "id", "pronunciationScore", "questionBankItemId", "score", "section", "status", "submittedAt", "taskCode", "title", "transcript", "transcriptConfidence", "transcriptProvider", "userId" FROM "PracticeSubmission";
DROP TABLE "PracticeSubmission";
ALTER TABLE "new_PracticeSubmission" RENAME TO "PracticeSubmission";
CREATE UNIQUE INDEX "PracticeSubmission_audioMetadataId_key" ON "PracticeSubmission"("audioMetadataId");
CREATE UNIQUE INDEX "PracticeSubmission_attemptId_key" ON "PracticeSubmission"("attemptId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_userId_purpose_idx" ON "MediaAsset"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAttempt_responseAudioId_key" ON "PracticeAttempt"("responseAudioId");

-- CreateIndex
CREATE INDEX "PracticeAttempt_userId_status_idx" ON "PracticeAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "PracticeAttempt_questionBankItemId_taskCode_idx" ON "PracticeAttempt"("questionBankItemId", "taskCode");

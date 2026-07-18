-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "overallScore" INTEGER,
    "speakingScore" INTEGER,
    "writingScore" INTEGER,
    "readingScore" INTEGER,
    "listeningScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'In_Progress',
    "currentQuestionIndex" INTEGER DEFAULT 0,
    "secondsRemaining" INTEGER DEFAULT 0,
    "answersJson" TEXT,
    "questionsJson" TEXT,
    "attemptStartedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TestAttempt" ("answersJson", "attemptStartedAt", "currentQuestionIndex", "date", "id", "listeningScore", "overallScore", "questionsJson", "readingScore", "secondsRemaining", "speakingScore", "status", "submittedAt", "testId", "title", "type", "userId", "writingScore") SELECT "answersJson", "attemptStartedAt", "currentQuestionIndex", "date", "id", "listeningScore", "overallScore", "questionsJson", "readingScore", "secondsRemaining", "speakingScore", "status", "submittedAt", "testId", "title", "type", "userId", "writingScore" FROM "TestAttempt";
DROP TABLE "TestAttempt";
ALTER TABLE "new_TestAttempt" RENAME TO "TestAttempt";
CREATE INDEX "TestAttempt_userId_status_idx" ON "TestAttempt"("userId", "status");

UPDATE "TestAttempt"
SET "overallScore" = NULL,
    "speakingScore" = NULL,
    "writingScore" = NULL,
    "readingScore" = NULL,
    "listeningScore" = NULL
WHERE "status" != 'Completed';

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "targetScore" INTEGER NOT NULL DEFAULT 79,
    "currentAvg" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studyPlan" TEXT,
    "estimatedScores" TEXT,
    "diagnosticDone" BOOLEAN NOT NULL DEFAULT false,
    "subTier" TEXT NOT NULL DEFAULT 'free',
    "couponApplied" TEXT,
    "subExpiresAt" DATETIME,
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" DATETIME,
    "passwordChangedAt" DATETIME,
    "lastLoginAt" DATETIME,
    "emailVerifiedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QuestionBankItem" (
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
    CONSTRAINT "QuestionBankItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorName" TEXT NOT NULL DEFAULT 'System'
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "answerText" TEXT,
    "audioUrl" TEXT,
    "questionBankItemId" TEXT,
    "answerJson" TEXT,
    "score" INTEGER,
    "fluencyScore" INTEGER,
    "pronunciationScore" INTEGER,
    "feedback" TEXT,
    "grammarIssues" INTEGER,
    CONSTRAINT "PracticeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "speakingScore" INTEGER NOT NULL,
    "writingScore" INTEGER NOT NULL,
    "readingScore" INTEGER NOT NULL,
    "listeningScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In_Progress',
    "currentQuestionIndex" INTEGER DEFAULT 0,
    "secondsRemaining" INTEGER DEFAULT 0,
    "answersJson" TEXT,
    "questionsJson" TEXT,
    "attemptStartedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlashcardState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FlashcardState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "result" TEXT,
    "error" TEXT,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "startedAt" DATETIME,
    "heartbeatAt" DATETIME,
    "leaseExpiresAt" DATETIME,
    "workerId" TEXT,
    "claimToken" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "idempotencyKey" TEXT
);

-- CreateTable
CREATE TABLE "MockQuestionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionVersion" INTEGER NOT NULL DEFAULT 1,
    "questionIndex" INTEGER NOT NULL,
    "taskType" TEXT NOT NULL,
    "normalizedResponse" JSONB NOT NULL,
    "audioMetadataId" TEXT,
    "transcript" TEXT,
    "transcriptProvider" TEXT,
    "transcriptConfidence" REAL,
    "rawDimensions" JSONB,
    "skillContributions" JSONB,
    "finalScore" INTEGER,
    "feedback" TEXT,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "rubricVersion" TEXT,
    "scoringPolicyVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "errorDetails" TEXT,
    "gradedAt" DATETIME,
    CONSTRAINT "MockQuestionResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MockQuestionResult_audioMetadataId_fkey" FOREIGN KEY ("audioMetadataId") REFERENCES "AudioMetadata" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AudioMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "durationSec" REAL,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    CONSTRAINT "AudioMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AudioMetadata_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockQuestionSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "expiredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'In_Progress',
    CONSTRAINT "MockQuestionSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaybackConsumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playedCount" INTEGER NOT NULL DEFAULT 0,
    "firstPlayedAt" DATETIME,
    "lastPlayedAt" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "PlaybackConsumption_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlaybackConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "QuestionBankItem_taskCode_idx" ON "QuestionBankItem"("taskCode");

-- CreateIndex
CREATE INDEX "QuestionBankItem_section_idx" ON "QuestionBankItem"("section");

-- CreateIndex
CREATE INDEX "QuestionBankItem_status_idx" ON "QuestionBankItem"("status");

-- CreateIndex
CREATE INDEX "QuestionBankItem_difficulty_idx" ON "QuestionBankItem"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "TestAttempt_userId_status_idx" ON "TestAttempt"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundJob_claimToken_key" ON "BackgroundJob"("claimToken");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundJob_idempotencyKey_key" ON "BackgroundJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_scheduledAt_idx" ON "BackgroundJob"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_leaseExpiresAt_idx" ON "BackgroundJob"("status", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MockQuestionResult_audioMetadataId_key" ON "MockQuestionResult"("audioMetadataId");

-- CreateIndex
CREATE INDEX "MockQuestionResult_attemptId_questionIndex_idx" ON "MockQuestionResult"("attemptId", "questionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MockQuestionResult_attemptId_questionId_key" ON "MockQuestionResult"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioMetadata_objectKey_key" ON "AudioMetadata"("objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "AudioMetadata_attemptId_questionId_key" ON "AudioMetadata"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "MockQuestionSession_attemptId_questionIndex_idx" ON "MockQuestionSession"("attemptId", "questionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MockQuestionSession_attemptId_questionId_key" ON "MockQuestionSession"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "PlaybackConsumption_userId_attemptId_idx" ON "PlaybackConsumption"("userId", "attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackConsumption_attemptId_questionId_key" ON "PlaybackConsumption"("attemptId", "questionId");

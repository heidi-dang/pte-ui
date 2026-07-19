-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "targetScore" INTEGER NOT NULL DEFAULT 79,
    "currentAvg" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studyPlan" TEXT,
    "estimatedScores" TEXT,
    "diagnosticDone" BOOLEAN NOT NULL DEFAULT false,
    "subTier" TEXT NOT NULL DEFAULT 'free',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "couponApplied" TEXT,
    "subExpiresAt" TIMESTAMP(3),
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBankItem" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionBankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomTask" (
    "id" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorName" TEXT NOT NULL DEFAULT 'System',

    CONSTRAINT "CustomTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "answerText" TEXT,
    "audioUrl" TEXT,
    "audioMetadataId" TEXT,
    "questionBankItemId" TEXT,
    "answerJson" TEXT,
    "transcript" TEXT,
    "transcriptProvider" TEXT,
    "transcriptConfidence" DOUBLE PRECISION,
    "score" INTEGER,
    "fluencyScore" INTEGER,
    "pronunciationScore" INTEGER,
    "feedback" TEXT,
    "grammarIssues" INTEGER,
    "attemptId" TEXT,

    CONSTRAINT "PracticeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL,
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
    "attemptStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "totalPauseMs" INTEGER NOT NULL DEFAULT 0,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "mastered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FlashcardState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "result" TEXT,
    "error" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "workerId" TEXT,
    "claimToken" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "idempotencyKey" TEXT,

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockQuestionResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionVersion" INTEGER NOT NULL DEFAULT 1,
    "questionIndex" INTEGER NOT NULL,
    "taskType" TEXT NOT NULL,
    "normalizedResponse" JSONB NOT NULL,
    "audioMetadataId" TEXT,
    "transcript" TEXT,
    "transcriptProvider" TEXT,
    "transcriptConfidence" DOUBLE PRECISION,
    "rawDimensions" JSONB,
    "skillContributions" JSONB,
    "finalScore" INTEGER,
    "feedback" TEXT,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "rubricVersion" TEXT,
    "scoringPolicyVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "errorDetails" TEXT,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "MockQuestionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "durationSec" DOUBLE PRECISION,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioMetadata" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "durationSec" DOUBLE PRECISION,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT,
    "questionId" TEXT,

    CONSTRAINT "AudioMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionBankItemId" TEXT,
    "questionVersion" INTEGER NOT NULL DEFAULT 1,
    "taskCode" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'timed',
    "status" TEXT NOT NULL DEFAULT 'In_Progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "questionSnapshotJson" TEXT NOT NULL,
    "scoringPolicyVersion" TEXT NOT NULL DEFAULT 'pte-estimated-v1',
    "playbackPolicySnapshotJson" TEXT,
    "gradingSnapshotJson" TEXT,
    "responseAudioId" TEXT,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticePlaybackConsumption" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "attemptId" TEXT,
    "userId" TEXT NOT NULL,
    "playedCount" INTEGER NOT NULL DEFAULT 0,
    "firstPlayedAt" TIMESTAMP(3),
    "lastPlayedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PracticePlaybackConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockQuestionSession" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'In_Progress',

    CONSTRAINT "MockQuestionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaybackConsumption" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playedCount" INTEGER NOT NULL DEFAULT 0,
    "firstPlayedAt" TIMESTAMP(3),
    "lastPlayedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PlaybackConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionGenerationBatch" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionGenerationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionGenerationCandidate" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "rawOutputJson" TEXT,
    "normalizedPayload" TEXT,
    "validationJson" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "qualityScore" INTEGER,
    "failureReason" TEXT,
    "questionBankItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionGenerationCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherStudentAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherStudentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherStudentNote" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherStudentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubmissionReview" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherSubmissionReview_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "QuestionBankItem_generationBatchId_idx" ON "QuestionBankItem"("generationBatchId");

-- CreateIndex
CREATE INDEX "QuestionBankItem_taskCode_reviewStatus_idx" ON "QuestionBankItem"("taskCode", "reviewStatus");

-- CreateIndex
CREATE INDEX "QuestionBankItem_taskCode_status_difficulty_idx" ON "QuestionBankItem"("taskCode", "status", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBankItem_taskCode_contentHash_key" ON "QuestionBankItem"("taskCode", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSubmission_audioMetadataId_key" ON "PracticeSubmission"("audioMetadataId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSubmission_attemptId_key" ON "PracticeSubmission"("attemptId");

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
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_userId_purpose_idx" ON "MediaAsset"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "AudioMetadata_objectKey_key" ON "AudioMetadata"("objectKey");

-- CreateIndex
CREATE INDEX "AudioMetadata_attemptId_questionId_idx" ON "AudioMetadata"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAttempt_responseAudioId_key" ON "PracticeAttempt"("responseAudioId");

-- CreateIndex
CREATE INDEX "PracticeAttempt_userId_status_idx" ON "PracticeAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "PracticeAttempt_questionBankItemId_taskCode_idx" ON "PracticeAttempt"("questionBankItemId", "taskCode");

-- CreateIndex
CREATE INDEX "PracticePlaybackConsumption_userId_idx" ON "PracticePlaybackConsumption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticePlaybackConsumption_submissionId_key" ON "PracticePlaybackConsumption"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticePlaybackConsumption_attemptId_key" ON "PracticePlaybackConsumption"("attemptId");

-- CreateIndex
CREATE INDEX "MockQuestionSession_attemptId_questionIndex_idx" ON "MockQuestionSession"("attemptId", "questionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MockQuestionSession_attemptId_questionId_key" ON "MockQuestionSession"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "PlaybackConsumption_userId_attemptId_idx" ON "PlaybackConsumption"("userId", "attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackConsumption_attemptId_questionId_key" ON "PlaybackConsumption"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionGenerationBatch_requestKey_key" ON "QuestionGenerationBatch"("requestKey");

-- CreateIndex
CREATE INDEX "QuestionGenerationBatch_status_createdAt_idx" ON "QuestionGenerationBatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionGenerationBatch_taskCode_status_idx" ON "QuestionGenerationBatch"("taskCode", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionGenerationCandidate_questionBankItemId_key" ON "QuestionGenerationCandidate"("questionBankItemId");

-- CreateIndex
CREATE INDEX "QuestionGenerationCandidate_batchId_status_idx" ON "QuestionGenerationCandidate"("batchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionGenerationCandidate_batchId_slotNumber_key" ON "QuestionGenerationCandidate"("batchId", "slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherStudentAssignment_teacherId_studentId_key" ON "TeacherStudentAssignment"("teacherId", "studentId");

-- CreateIndex
CREATE INDEX "TeacherStudentNote_studentId_idx" ON "TeacherStudentNote"("studentId");

-- CreateIndex
CREATE INDEX "TeacherSubmissionReview_submissionId_idx" ON "TeacherSubmissionReview"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubmissionReview_teacherId_submissionId_key" ON "TeacherSubmissionReview"("teacherId", "submissionId");

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_generationBatchId_fkey" FOREIGN KEY ("generationBatchId") REFERENCES "QuestionGenerationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSubmission" ADD CONSTRAINT "PracticeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSubmission" ADD CONSTRAINT "PracticeSubmission_audioMetadataId_fkey" FOREIGN KEY ("audioMetadataId") REFERENCES "AudioMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSubmission" ADD CONSTRAINT "PracticeSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProgress" ADD CONSTRAINT "CourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardState" ADD CONSTRAINT "FlashcardState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockQuestionResult" ADD CONSTRAINT "MockQuestionResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockQuestionResult" ADD CONSTRAINT "MockQuestionResult_audioMetadataId_fkey" FOREIGN KEY ("audioMetadataId") REFERENCES "AudioMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioMetadata" ADD CONSTRAINT "AudioMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioMetadata" ADD CONSTRAINT "AudioMetadata_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_responseAudioId_fkey" FOREIGN KEY ("responseAudioId") REFERENCES "AudioMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlaybackConsumption" ADD CONSTRAINT "PracticePlaybackConsumption_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PracticeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlaybackConsumption" ADD CONSTRAINT "PracticePlaybackConsumption_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PracticeAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlaybackConsumption" ADD CONSTRAINT "PracticePlaybackConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockQuestionSession" ADD CONSTRAINT "MockQuestionSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackConsumption" ADD CONSTRAINT "PlaybackConsumption_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackConsumption" ADD CONSTRAINT "PlaybackConsumption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGenerationBatch" ADD CONSTRAINT "QuestionGenerationBatch_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGenerationCandidate" ADD CONSTRAINT "QuestionGenerationCandidate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "QuestionGenerationBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGenerationCandidate" ADD CONSTRAINT "QuestionGenerationCandidate_questionBankItemId_fkey" FOREIGN KEY ("questionBankItemId") REFERENCES "QuestionBankItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudentAssignment" ADD CONSTRAINT "TeacherStudentAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudentAssignment" ADD CONSTRAINT "TeacherStudentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudentNote" ADD CONSTRAINT "TeacherStudentNote_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudentNote" ADD CONSTRAINT "TeacherStudentNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubmissionReview" ADD CONSTRAINT "TeacherSubmissionReview_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubmissionReview" ADD CONSTRAINT "TeacherSubmissionReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PracticeSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

// ---------------------------------------------------------------------------
// Shared practice API response schemas
// Server, client, hooks, and UI all use these types.
// ---------------------------------------------------------------------------

import type { StudentSafeQuestion } from '../../practice/contracts/studentSafeQuestion';

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
export type PracticeStatus =
  | 'idle'
  | 'In_Progress'
  | 'Pending_Transcription'
  | 'Transcribing'
  | 'Transcription_Failed'
  | 'Pending_Grading'
  | 'Pending_Deterministic'
  | 'Grading'
  | 'Grading_Failed'
  | 'Completed'
  | 'Expired';

export type NextAction =
  | 'poll_result'
  | 'wait_for_transcription'
  | 'wait_for_grading'
  | 'completed'
  | 'failed';

// ---------------------------------------------------------------------------
// Generic API wrappers
// ---------------------------------------------------------------------------
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const ErrorCodes = {
  ATTEMPT_NOT_FOUND_OR_FORBIDDEN: 'ATTEMPT_NOT_FOUND_OR_FORBIDDEN',
  ATTEMPT_EXPIRED: 'ATTEMPT_EXPIRED',
  ATTEMPT_NOT_IN_PROGRESS: 'ATTEMPT_NOT_IN_PROGRESS',
  PROMPT_PLAYBACK_LIMIT_REACHED: 'PROMPT_PLAYBACK_LIMIT_REACHED',
  PROMPT_AUDIO_NOT_AVAILABLE: 'PROMPT_AUDIO_NOT_AVAILABLE',
  RESPONSE_AUDIO_REQUIRED: 'RESPONSE_AUDIO_REQUIRED',
  RESPONSE_AUDIO_MISSING: 'RESPONSE_AUDIO_MISSING',
  RESPONSE_TEXT_MISSING: 'RESPONSE_TEXT_MISSING',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  QUESTION_NOT_PUBLISHED: 'QUESTION_NOT_PUBLISHED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ---------------------------------------------------------------------------
// Endpoint-specific response data
// ---------------------------------------------------------------------------
export interface StartAttemptData {
  attemptId: string;
  status: PracticeStatus;
  deadlineAt: string | null;
  taskCode: string;
  section: string;
  timing: { prepSeconds: number; responseSeconds: number };
  playbackPolicy: Record<string, unknown>;
  question: StudentSafeQuestion;
}

export interface PlayPromptData {
  attemptId: string;
  playbackId: string;
  audioUrl: string | null;
  expiresAt: string | null;
  remainingPlays: number;
  playedCount: number;
  maxPlays: number;
}

export interface UploadAudioData {
  attemptId: string;
  responseAudioId: string;
  status: PracticeStatus;
}

export interface SubmitAttemptData {
  attemptId: string;
  submissionId: string;
  status: PracticeStatus;
  nextAction: NextAction;
}

export interface ResultPayload {
  score: number | null;
  maxScore?: number | null;
  earnedScore?: number | null;
  normalizedScore?: number | null;
  scorerVersion?: string | null;
  feedback: string | null;
  breakdown?: Record<string, unknown> | null;
  transcript: string | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  grammarIssues: number | null;
}

export interface GetAttemptResultData {
  attemptId: string;
  status: PracticeStatus;
  result: ResultPayload | null;
}

export interface GetAttemptData {
  id: string;
  taskCode: string;
  mode: string;
  status: string;
  startedAt: string;
  deadlineAt: string | null;
  submittedAt: string | null;
  hasResponseAudio: boolean;
  submissionId: string | null;
  submissionStatus: string | null;
}

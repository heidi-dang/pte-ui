export const MOCK_ATTEMPT_STATUS = {
  IN_PROGRESS: 'In_Progress',
  PAUSED: 'Paused',
  PENDING_GRADING: 'Pending_Grading',
  GRADING: 'Grading',
  GRADING_FAILED: 'Grading_Failed',
  COMPLETED: 'Completed',
} as const;

export type MockAttemptStatus =
  typeof MOCK_ATTEMPT_STATUS[keyof typeof MOCK_ATTEMPT_STATUS];

export const ACTIVE_RESUME_STATUSES: MockAttemptStatus[] = [
  MOCK_ATTEMPT_STATUS.IN_PROGRESS,
  MOCK_ATTEMPT_STATUS.PAUSED,
];

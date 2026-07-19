import { MockExamQuestionSchema, type MockExamQuestion } from '../shared/mockExamTypes';

export interface SnapshotValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMockExamSnapshot(test: {
  questions: MockExamQuestion[];
}): SnapshotValidationResult {
  const result: SnapshotValidationResult = { valid: true, errors: [], warnings: [] };
  if (!test.questions || test.questions.length === 0) {
    result.errors.push('Test has no questions');
    result.valid = false;
    return result;
  }
  for (const q of test.questions) {
    const qResult = validateMockQuestionSnapshot(q);
    if (!qResult.valid) {
      result.errors.push(...qResult.errors);
      result.valid = false;
    }
    result.warnings.push(...qResult.warnings);
  }
  return result;
}

export function validateMockQuestionSnapshot(
  question: Partial<MockExamQuestion>
): SnapshotValidationResult {
  const result: SnapshotValidationResult = { valid: true, errors: [], warnings: [] };
  if (!question.taskCode) {
    result.errors.push('Question missing taskCode');
    result.valid = false;
  }
  if (!question.questionId && !question.id) {
    result.errors.push('Question missing id');
    result.valid = false;
  }
  if (!question.instruction) {
    result.errors.push('Question missing instruction');
    result.valid = false;
  }
  if (question.source === 'cms' && !question.questionBankItemId) {
    result.warnings.push('CMS-sourced question missing questionBankItemId');
  }
  if (question.contentVersion === undefined || question.contentVersion === null) {
    result.warnings.push('Question missing contentVersion');
  }
  return result;
}

export function assertSnapshotGradable(question: MockExamQuestion): SnapshotValidationResult {
  const result: SnapshotValidationResult = { valid: true, errors: [], warnings: [] };
  const baseCheck = validateMockQuestionSnapshot(question);
  result.errors.push(...baseCheck.errors);
  result.warnings.push(...baseCheck.warnings);
  if (baseCheck.errors.length > 0) {
    result.valid = false;
    return result;
  }
  if (!question.promptText && !question.audioUrl) {
    result.errors.push('Question has no prompt text or audio');
    result.valid = false;
  }
  return result;
}

import { z } from 'zod';
import { getContract } from './registry';
import type { PTETaskCode, CanonicalTaskContract, ScoringMode } from './types';

// ---------------------------------------------------------------------------
// Answer-key schemas for deterministic tasks
// ---------------------------------------------------------------------------
const singleOptionKey = z.object({ correctOptionId: z.string().min(1) });
const multiOptionKey = z.object({ correctOptionIds: z.array(z.string()).min(1) });
const orderKey = z.object({ correctOrder: z.array(z.string()).min(2) });
const blanksKey = z.object({ blanks: z.array(z.object({ id: z.string(), acceptedAnswers: z.array(z.string()).min(1) })).min(1) });
const hiwKey = z.object({ incorrectTokenPositions: z.array(z.number().int().min(0)).min(1) });
const wfdKey = z.object({ referenceText: z.string().min(1) });
const asqKey = z.object({ acceptedAnswers: z.array(z.string()).min(1), aliases: z.array(z.string()).optional() });

export function getAnswerKeySchema(taskCode: PTETaskCode): z.ZodType<any> | null {
  const schemas: Partial<Record<PTETaskCode, z.ZodType<any>>> = {
    MCS: singleOptionKey,
    HCS: singleOptionKey,
    MCSSL: singleOptionKey,
    SMW: singleOptionKey,
    MCM: multiOptionKey,
    MCMSL: multiOptionKey,
    ROP: orderKey,
    FIBR: blanksKey,
    FIBRW: blanksKey,
    FIBL: blanksKey,
    HIW: hiwKey,
    WFD: wfdKey,
    ASQ: asqKey,
  };
  return schemas[taskCode] ?? null;
}

// ---------------------------------------------------------------------------
// Validation issue types
// ---------------------------------------------------------------------------
export type PublishValidationSeverity = 'error' | 'warning';

export interface PublishValidationIssue {
  code: string;
  field: string;
  message: string;
  severity: PublishValidationSeverity;
}

export interface PublishValidationResult {
  canPublish: boolean;
  issues: PublishValidationIssue[];
}

// ---------------------------------------------------------------------------
// Stable issue codes
// ---------------------------------------------------------------------------
export const IssueCodes = {
  TASK_UNKNOWN: 'TASK_UNKNOWN',
  QUESTION_SCHEMA_INVALID: 'QUESTION_SCHEMA_INVALID',
  ANSWER_KEY_MISSING: 'ANSWER_KEY_MISSING',
  ANSWER_KEY_INVALID: 'ANSWER_KEY_INVALID',
  PROMPT_AUDIO_REQUIRED: 'PROMPT_AUDIO_REQUIRED',
  RESPONSE_AUDIO_REQUIRED: 'RESPONSE_AUDIO_REQUIRED',
  IMAGE_REQUIRED: 'IMAGE_REQUIRED',
  OPTIONS_REQUIRED: 'OPTIONS_REQUIRED',
  CORRECT_OPTION_INVALID: 'CORRECT_OPTION_INVALID',
  CORRECT_ORDER_INVALID: 'CORRECT_ORDER_INVALID',
  BLANK_ANSWER_MISMATCH: 'BLANK_ANSWER_MISMATCH',
  HIW_POSITION_INVALID: 'HIW_POSITION_INVALID',
  HIDDEN_PROMPT_EXPOSED: 'HIDDEN_PROMPT_EXPOSED',
  UNSAFE_STUDENT_FIELD: 'UNSAFE_STUDENT_FIELD',
  ACCEPTED_ANSWERS_MISSING: 'ACCEPTED_ANSWERS_MISSING',
  REFERENCE_TEXT_MISSING: 'REFERENCE_TEXT_MISSING',
  TOKEN_POSITIONS_MISSING: 'TOKEN_POSITIONS_MISSING',
} as const;

// ---------------------------------------------------------------------------
// Hidden prompt tasks
// ---------------------------------------------------------------------------
const HIDDEN_PROMPT_TASKS = new Set<PTETaskCode>([
  'RS', 'RL', 'ASQ', 'SGD', 'SST', 'FIBL',
  'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD',
]);

// ---------------------------------------------------------------------------
// Main validation function
// ---------------------------------------------------------------------------
export function validatePublishableQuestion(
  taskCode: PTETaskCode,
  payload: Record<string, unknown>,
): PublishValidationResult {
  const issues: PublishValidationIssue[] = [];

  // 1. Task exists in registry
  let contract: CanonicalTaskContract;
  try {
    contract = getContract(taskCode);
  } catch {
    return { canPublish: false, issues: [{ code: IssueCodes.TASK_UNKNOWN, field: 'taskCode', message: `Unknown task code: ${taskCode}`, severity: 'error' }] };
  }

  // 2. Question schema validation
  try {
    const schemaResult = contract.questionSchema.safeParse(payload);
    if (!schemaResult.success) {
      for (const err of schemaResult.error.issues) {
        issues.push({ code: IssueCodes.QUESTION_SCHEMA_INVALID, field: err.path.join('.'), message: err.message, severity: 'error' });
      }
    }
  } catch {
    issues.push({ code: IssueCodes.QUESTION_SCHEMA_INVALID, field: 'payload', message: 'Failed to parse question payload against schema', severity: 'error' });
  }

  const media = contract.media;

  // 3. Asset validation
  if (media.requiresPromptAudio && !payload.audioUrl) {
    issues.push({ code: IssueCodes.PROMPT_AUDIO_REQUIRED, field: 'audioUrl', message: `${taskCode} requires prompt audio`, severity: 'error' });
  }
  if (media.requiresResponseRecording && !payload.requiresResponseRecording && !payload.recordingConfig) {
    // Response recording is a contract-level policy; the question payload doesn't need extra config for this
  }
  if (media.requiresImage && !payload.imageUrl) {
    issues.push({ code: IssueCodes.IMAGE_REQUIRED, field: 'imageUrl', message: `${taskCode} requires an image`, severity: 'error' });
  }

  // 4. Options validation for structured tasks
  if (contract.responseMode === 'structured') {
    const opts = payload.optionsJson;
    if (Array.isArray(opts)) {
      if (opts.length < 2) {
        issues.push({ code: IssueCodes.OPTIONS_REQUIRED, field: 'optionsJson', message: `${taskCode} requires at least 2 options`, severity: 'error' });
      }
    }
  }

  // 5. Answer key validation for deterministic tasks
  if (contract.scoringMode === 'deterministic') {
    const answerKeySchema = getAnswerKeySchema(taskCode);
    if (!answerKeySchema) {
      issues.push({ code: IssueCodes.ANSWER_KEY_MISSING, field: 'answerKeyJson', message: `No answer-key schema registered for ${taskCode}`, severity: 'error' });
    } else if (payload.answerKeyJson == null || payload.answerKeyJson === '') {
      issues.push({ code: IssueCodes.ANSWER_KEY_MISSING, field: 'answerKeyJson', message: `${taskCode} requires answer key for deterministic scoring`, severity: 'error' });
    } else {
      let answerKey: unknown;
      try {
        answerKey = typeof payload.answerKeyJson === 'string' ? JSON.parse(payload.answerKeyJson) : payload.answerKeyJson;
      } catch {
        issues.push({ code: IssueCodes.ANSWER_KEY_INVALID, field: 'answerKeyJson', message: `Answer key for ${taskCode} is not valid JSON`, severity: 'error' });
        answerKey = null;
      }

      const keyResult = answerKey != null ? answerKeySchema.safeParse(answerKey) : { success: false as const, error: null };
      if (!keyResult.success) {
        if (keyResult.error) {
          for (const err of keyResult.error.issues) {
            issues.push({ code: IssueCodes.ANSWER_KEY_INVALID, field: `answerKeyJson.${err.path.join('.')}`, message: `${taskCode} answer key: ${err.message}`, severity: 'error' });
          }
        }
      } else {
        // Task-specific cross-field validation
        const parsedKey = keyResult.data;
        const opts = payload.optionsJson;
        const optionIds = Array.isArray(opts) ? opts : [];

        switch (taskCode) {
          case 'MCS':
          case 'HCS':
          case 'MCSSL':
          case 'SMW': {
            if (optionIds.length > 0 && !optionIds.includes(parsedKey.correctOptionId)) {
              issues.push({ code: IssueCodes.CORRECT_OPTION_INVALID, field: 'answerKeyJson.correctOptionId', message: `correctOptionId "${parsedKey.correctOptionId}" not in options`, severity: 'error' });
            }
            break;
          }
          case 'MCM':
          case 'MCMSL': {
            for (const id of parsedKey.correctOptionIds) {
              if (optionIds.length > 0 && !optionIds.includes(id)) {
                issues.push({ code: IssueCodes.CORRECT_OPTION_INVALID, field: 'answerKeyJson.correctOptionIds', message: `correctOptionId "${id}" not in options`, severity: 'error' });
              }
            }
            break;
          }
          case 'ROP': {
            if (optionIds.length > 0) {
              for (const id of parsedKey.correctOrder) {
                if (!optionIds.includes(id)) {
                  issues.push({ code: IssueCodes.CORRECT_ORDER_INVALID, field: 'answerKeyJson.correctOrder', message: `option "${id}" in correctOrder not in options`, severity: 'error' });
                }
              }
            }
            break;
          }
          case 'FIBR':
          case 'FIBRW':
          case 'FIBL': {
            // Blanks validation: blank IDs should be unique and acceptedAnswers should be non-empty
            const blankIds = new Set<string>();
            for (const blank of parsedKey.blanks) {
              if (blankIds.has(blank.id)) {
                issues.push({ code: IssueCodes.BLANK_ANSWER_MISMATCH, field: `answerKeyJson.blanks.${blank.id}`, message: `Duplicate blank id: ${blank.id}`, severity: 'error' });
              }
              blankIds.add(blank.id);
            }
            break;
          }
          case 'HIW': {
            // Validate token positions against the prompt text token count
            const promptText = (payload.promptText || '') as string;
            const tokenCount = promptText.split(/\s+/).filter(Boolean).length;
            if (tokenCount > 0) {
              for (const pos of parsedKey.incorrectTokenPositions) {
                if (pos >= tokenCount) {
                  issues.push({ code: IssueCodes.HIW_POSITION_INVALID, field: 'answerKeyJson.incorrectTokenPositions', message: `Position ${pos} out of range (${tokenCount} tokens)`, severity: 'error' });
                }
              }
            }
            break;
          }
          case 'WFD': {
            if (!parsedKey.referenceText || parsedKey.referenceText.trim().length === 0) {
              issues.push({ code: IssueCodes.REFERENCE_TEXT_MISSING, field: 'answerKeyJson.referenceText', message: 'WFD requires non-empty referenceText', severity: 'error' });
            }
            break;
          }
          case 'ASQ': {
            if (!parsedKey.acceptedAnswers || parsedKey.acceptedAnswers.length === 0) {
              issues.push({ code: IssueCodes.ACCEPTED_ANSWERS_MISSING, field: 'answerKeyJson.acceptedAnswers', message: 'ASQ requires at least one accepted answer', severity: 'error' });
            }
            break;
          }
        }
      }
    }
  }

  // 5b. Non-deterministic AI tasks — validate answer key exists for scoring reference
  if (contract.scoringMode !== 'deterministic' && (taskCode === 'SGD' || taskCode === 'SST')) {
    if (!payload.answerKeyJson) {
      issues.push({ code: IssueCodes.ANSWER_KEY_MISSING, field: 'answerKeyJson', message: `${taskCode} requires answer key for scoring reference`, severity: 'warning' });
    }
  }

  // 6. Hidden prompt validation
  if (HIDDEN_PROMPT_TASKS.has(taskCode)) {
    if (payload.promptText && typeof payload.promptText === 'string' && payload.promptText.length > 0) {
      if (taskCode === 'RS' || taskCode === 'RL' || taskCode === 'ASQ' || taskCode === 'SGD') {
        issues.push({ code: IssueCodes.HIDDEN_PROMPT_EXPOSED, field: 'promptText', message: `${taskCode} must not expose transcript in promptText`, severity: 'error' });
      }
      if (taskCode === 'WFD') {
        issues.push({ code: IssueCodes.HIDDEN_PROMPT_EXPOSED, field: 'promptText', message: 'WFD must not expose prompt text (hidden dictation)', severity: 'error' });
      }
    }
  }

  const canPublish = issues.every((i) => i.severity !== 'error');
  return { canPublish, issues };
}

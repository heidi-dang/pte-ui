import { TaskCode } from '../../shared/questionTaskRegistry';

const HIDDEN_PROMPT_TASKS = new Set(['RS', 'RL', 'ASQ', 'SGD', 'WFD']);

export function normalizeCandidate(candidate: any, taskCode: TaskCode): any {
  if (!candidate || typeof candidate !== 'object') return candidate;

  const normalized = { ...candidate, taskCode };

  if (Array.isArray(normalized.tagsJson)) {
    normalized.tagsJson = JSON.stringify(normalized.tagsJson);
  } else if (normalized.tags && Array.isArray(normalized.tags)) {
    normalized.tagsJson = JSON.stringify(normalized.tags);
  }

  for (const key of ['promptText', 'passageText', 'instruction', 'explanation']) {
    if (typeof normalized[key] === 'string') {
      normalized[key] = normalized[key].trim().replace(/\r\n/g, '\n');
    }
  }

  if (normalized.taskPayload && typeof normalized.taskPayload === 'object') {
    const payload = normalized.taskPayload;

    if (['MCS', 'MCM', 'MCSSL', 'SMW', 'FIBR'].includes(taskCode) && payload.options) {
      normalized.optionsJson = payload.options;
    }
    if (taskCode === 'HCS' && payload.summaryOptions) {
      normalized.optionsJson = payload.summaryOptions;
    }
    if (taskCode === 'MCMSL' && payload.options) {
      normalized.optionsJson = payload.options;
    }
    if (taskCode === 'ROP' && payload.paragraphBlocks) {
      normalized.optionsJson = payload.paragraphBlocks;
    }
    if (taskCode === 'FIBRW' && payload.optionSets) {
      const allVals = new Set<string>();
      for (const key of Object.keys(payload.optionSets)) {
        for (const val of (payload.optionSets[key] || [])) {
          allVals.add(val);
        }
      }
      normalized.optionsJson = Array.from(allVals);
    }

    if (['MCS', 'MCSSL', 'SMW'].includes(taskCode) && payload.correctAnswer) {
      normalized.answerKeyJson = JSON.stringify({ correctOptionId: payload.correctAnswer });
    }
    if (taskCode === 'HCS' && payload.correctSummary) {
      normalized.answerKeyJson = JSON.stringify({ correctOptionId: payload.correctSummary });
    }
    if (['MCM', 'MCMSL'].includes(taskCode) && payload.correctAnswers) {
      normalized.answerKeyJson = JSON.stringify({ correctOptionIds: payload.correctAnswers });
    }
    if (taskCode === 'ROP' && payload.canonicalOrder) {
      normalized.answerKeyJson = JSON.stringify({ correctOrder: payload.canonicalOrder });
    }
    if (['FIBR', 'FIBRW', 'FIBL'].includes(taskCode) && payload.answerMap) {
      const blanks = Object.entries(payload.answerMap).map(([id, ans]) => ({
        id,
        acceptedAnswers: [ans],
      }));
      normalized.answerKeyJson = JSON.stringify({ blanks });
    }
    if (taskCode === 'HIW' && payload.mismatchIndexes) {
      normalized.answerKeyJson = JSON.stringify({ incorrectTokenPositions: payload.mismatchIndexes });
    }
    if (taskCode === 'WFD' && payload.canonicalTranscript) {
      normalized.answerKeyJson = JSON.stringify({ referenceText: payload.canonicalTranscript });
    }
    if (taskCode === 'ASQ' && payload.acceptedShortAnswers) {
      normalized.answerKeyJson = JSON.stringify({ acceptedAnswers: payload.acceptedShortAnswers });
    }

    if (HIDDEN_PROMPT_TASKS.has(taskCode as any)) {
      normalized.promptText = '';
    }

    normalized.taskPayloadJson = JSON.stringify(normalized.taskPayload);
  }

  return normalized;
}

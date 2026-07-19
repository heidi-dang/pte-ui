import type { NormalizedMockResponse } from '../shared/mockExamResponses';

export function normalizeMockResponse(
  taskCode: string,
  rawAnswer: unknown
): NormalizedMockResponse {
  if (!rawAnswer) {
    return getEmptyFallback(taskCode);
  }

  if (typeof rawAnswer === 'object' && rawAnswer !== null && 'kind' in (rawAnswer as any)) {
    return rawAnswer as NormalizedMockResponse;
  }

  return parseLegacyResponse(taskCode, rawAnswer);
}

function getEmptyFallback(taskCode: string): NormalizedMockResponse {
  switch (taskCode) {
    case 'RA': case 'RS': case 'DI': case 'RL': case 'ASQ': case 'SGD': case 'RTS':
      return { kind: 'audio' };
    case 'SWT': case 'WE': case 'SST': case 'WFD':
      return { kind: 'text', text: '' };
    case 'MCS': case 'MCSSL': case 'HCS': case 'SMW':
      return { kind: 'single_choice', selected: '' };
    case 'MCM': case 'MCMSL':
      return { kind: 'multi_choice', selected: [] };
    case 'ROP':
      return { kind: 'ordered_list', ordered: [] };
    case 'FIBR': case 'FIBRW': case 'FIBL':
      return { kind: 'blanks', blanks: {} };
    case 'HIW':
      return { kind: 'highlight_words', words: [] };
    default:
      return { kind: 'text', text: '' };
  }
}

function parseLegacyResponse(
  taskCode: string,
  raw: unknown
): NormalizedMockResponse {
  const str = String(raw ?? '');

  switch (taskCode) {
    case 'RA': case 'RS': case 'DI': case 'RL': case 'ASQ': case 'SGD': case 'RTS':
      return { kind: 'audio', transcript: str };
    case 'SWT': case 'WE': case 'SST': case 'WFD':
      return { kind: 'text', text: str };
    case 'MCS': case 'MCSSL': case 'HCS': case 'SMW':
      return { kind: 'single_choice', selected: str };
    case 'MCM': case 'MCMSL': {
      try { const arr = JSON.parse(str); return { kind: 'multi_choice', selected: Array.isArray(arr) ? arr : [] }; }
      catch { return { kind: 'multi_choice', selected: str ? [str] : [] }; }
    }
    case 'ROP': {
      try { const arr = JSON.parse(str); return { kind: 'ordered_list', ordered: Array.isArray(arr) ? arr : [] }; }
      catch { return { kind: 'ordered_list', ordered: [] }; }
    }
    case 'FIBR': case 'FIBRW': case 'FIBL': {
      try { const obj = JSON.parse(str); return { kind: 'blanks', blanks: typeof obj === 'object' && obj !== null ? obj : {} }; }
      catch { return { kind: 'blanks', blanks: {} }; }
    }
    case 'HIW': {
      try { const arr = JSON.parse(str); return { kind: 'highlight_words', words: Array.isArray(arr) ? arr : [] }; }
      catch { return { kind: 'highlight_words', words: [] }; }
    }
    default:
      return { kind: 'text', text: str };
  }
}

export function parseStoredMockResponse(
  taskCode: string,
  stored: string | null | undefined
): NormalizedMockResponse {
  if (!stored) return getEmptyFallback(taskCode);
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed === 'object' && parsed !== null && 'kind' in parsed) {
      return parsed as NormalizedMockResponse;
    }
    return parseLegacyResponse(taskCode, parsed);
  } catch {
    return parseLegacyResponse(taskCode, stored);
  }
}

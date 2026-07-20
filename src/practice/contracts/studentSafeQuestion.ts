import { getContract } from './registry';
import type { PTETaskCode, CanonicalTaskContract } from './types';

export interface StudentSafeQuestion {
  id: string;
  taskCode: string;
  section: string;
  title: string;
  instruction: string;
  difficulty: string | null;
  hasPromptAudio: boolean;
  hasImage: boolean;
  playbackPolicy: { maxPlays: number; autoplay: boolean; allowPause: boolean; allowSeek: boolean; revealTranscript: boolean };
  responseMode: string;
  timing: { prepSeconds: number; responseSeconds: number };
  promptText?: string;
  promptHtml?: string;
  passageText?: string;
  imageUrl?: string;
  audioUrl?: string;
  options?: string[];
  blanks?: string[];
}

const HIDDEN_PROMPT_TASKS = new Set<PTETaskCode>([
  'RS', 'RL', 'ASQ', 'SGD', 'SST', 'FIBL',
  'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD',
]);

const AUDIO_ONLY_TASKS = new Set<PTETaskCode>([
  'RS', 'RL', 'ASQ', 'SGD',
  'HCS', 'MCSSL', 'MCMSL', 'SMW',
]);

export function buildStudentSafeQuestion(
  taskCode: PTETaskCode,
  raw: Record<string, unknown>,
  playbackPolicy?: { maxPlays: number; autoplay: boolean; allowPause: boolean; allowSeek: boolean; revealTranscript: boolean },
): StudentSafeQuestion {
  const contract = getContract(taskCode);

  const safe: StudentSafeQuestion = {
    id: String(raw.id || ''),
    taskCode: String(raw.taskCode || taskCode),
    section: contract.section,
    title: String(raw.title || ''),
    instruction: String(raw.instruction || ''),
    difficulty: raw.difficulty ? String(raw.difficulty) : null,
    hasPromptAudio: contract.media.requiresPromptAudio,
    hasImage: contract.media.requiresImage,
    playbackPolicy: playbackPolicy || {
      maxPlays: contract.playbackPolicy.maxPlays,
      autoplay: contract.playbackPolicy.autoplay,
      allowPause: contract.playbackPolicy.allowPause,
      allowSeek: contract.playbackPolicy.allowSeek,
      revealTranscript: contract.playbackPolicy.revealTranscript,
    },
    responseMode: contract.responseMode,
    timing: { ...contract.timing },
  };

  // Never include: answerKeyJson, acceptedAnswers, aliases, scoring metadata

  // Audio URL — expose for listening tasks so frontend can play prompt
  if (contract.media.requiresPromptAudio && raw.audioUrl) {
    safe.audioUrl = String(raw.audioUrl);
  }

  // Visible prompt text — show only when safe
  if (!HIDDEN_PROMPT_TASKS.has(taskCode)) {
    if (raw.promptText) safe.promptText = String(raw.promptText);
    if (raw.promptHtml) safe.promptHtml = String(raw.promptHtml);
  }

  // Passage text — show for reading/writing tasks (visible written content)
  if (!HIDDEN_PROMPT_TASKS.has(taskCode) && raw.passageText) {
    safe.passageText = String(raw.passageText);
  }

  // Image — show only for image-based tasks
  if (contract.media.requiresImage && raw.imageUrl) {
    safe.imageUrl = String(raw.imageUrl);
  }

  // Options — show for selection tasks (never which one is correct)
  if (contract.responseMode === 'structured') {
    if (raw.optionsJson && typeof raw.optionsJson === 'string') {
      try { safe.options = JSON.parse(raw.optionsJson); } catch { /* ignore */ }
    } else if (raw.optionsJson && Array.isArray(raw.optionsJson)) {
      safe.options = raw.optionsJson as string[];
    } else if (raw.options && Array.isArray(raw.options)) {
      safe.options = raw.options as string[];
    }
  }

  return safe;
}

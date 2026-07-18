import { z } from 'zod';
import type { CanonicalTaskContract, PTETaskCode } from './types';

function stringOpt(): z.ZodString {
  return z.string().min(1);
}

const audioQuestion = z.object({ audioUrl: stringOpt() });
const textQuestion = z.object({ promptText: stringOpt() });
const imageQuestion = z.object({ imageUrl: stringOpt(), promptText: stringOpt() });
const optionsQuestion = (min = 2) => z.object({ promptText: stringOpt(), optionsJson: z.array(z.string()).min(min) });
const blanksQuestion = z.object({ promptText: stringOpt(), optionsJson: z.array(z.string()).min(1) });
const audioOptionsQuestion = (min = 2) => z.object({ audioUrl: stringOpt(), optionsJson: z.array(z.string()).min(min) });
const fillBlankResponse = z.object({ blanks: z.record(z.string(), z.string()) });

const audioRecordedResponse = z.object({ audioRecorded: z.literal(true) });
const typedTextResponse = z.object({ typedText: z.string().min(1) });
const selectedOptionResponse = z.object({ selectedOption: stringOpt() });
const selectedMultipleResponse = z.object({ selectedMultiple: z.array(z.string()).min(1) });
const reorderedListResponse = z.object({ reorderedList: z.array(z.string()).min(2) });
const highlightedIncorrectResponse = z.object({ highlightedIncorrect: z.array(z.string()).min(1) });

function identity<T>(x: T): T { return x; }

export const TASK_REGISTRY: Record<PTETaskCode, CanonicalTaskContract> = {
  RA: {
    code: 'RA', name: 'Read Aloud', section: 'Speaking',
    questionSchema: textQuestion,
    responseSchema: audioRecordedResponse,
    timing: { prepSeconds: 35, responseSeconds: 40 },
    media: { requiresPromptAudio: false, requiresResponseRecording: true, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'speech',
    normalizeResponse: identity,
  },
  RS: {
    code: 'RS', name: 'Repeat Sentence', section: 'Speaking',
    questionSchema: audioQuestion,
    responseSchema: audioRecordedResponse,
    timing: { prepSeconds: 3, responseSeconds: 15 },
    media: { requiresPromptAudio: true, requiresResponseRecording: true, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'speech',
    normalizeResponse: identity,
  },
  DI: {
    code: 'DI', name: 'Describe Image', section: 'Speaking',
    questionSchema: imageQuestion,
    responseSchema: audioRecordedResponse,
    timing: { prepSeconds: 25, responseSeconds: 40 },
    media: { requiresPromptAudio: false, requiresResponseRecording: true, requiresImage: true },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'speech',
    normalizeResponse: identity,
  },
  RL: {
    code: 'RL', name: 'Retell Lecture', section: 'Speaking',
    questionSchema: audioQuestion,
    responseSchema: audioRecordedResponse,
    timing: { prepSeconds: 10, responseSeconds: 40 },
    media: { requiresPromptAudio: true, requiresResponseRecording: true, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'speech',
    normalizeResponse: identity,
  },
  ASQ: {
    code: 'ASQ', name: 'Answer Short Question', section: 'Speaking',
    questionSchema: audioQuestion,
    responseSchema: audioRecordedResponse,
    timing: { prepSeconds: 3, responseSeconds: 10 },
    media: { requiresPromptAudio: true, requiresResponseRecording: true, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  SGD: {
    code: 'SGD', name: 'Summarize Group Discussion', section: 'Speaking',
    questionSchema: audioQuestion,
    responseSchema: audioRecordedResponse,
    timing: { prepSeconds: 10, responseSeconds: 60 },
    media: { requiresPromptAudio: true, requiresResponseRecording: true, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'speech',
    normalizeResponse: identity,
  },
  RTS: {
    code: 'RTS', name: 'Respond to a Situation', section: 'Speaking',
    questionSchema: textQuestion,
    responseSchema: audioRecordedResponse,
    timing: { prepSeconds: 10, responseSeconds: 40 },
    media: { requiresPromptAudio: false, requiresResponseRecording: true, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'speech',
    normalizeResponse: identity,
  },
  SWT: {
    code: 'SWT', name: 'Summarize Written Text', section: 'Writing',
    questionSchema: textQuestion,
    responseSchema: typedTextResponse,
    timing: { prepSeconds: 0, responseSeconds: 600 },
    media: { requiresPromptAudio: false, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'open_response',
    normalizeResponse: identity,
  },
  WE: {
    code: 'WE', name: 'Write Essay', section: 'Writing',
    questionSchema: textQuestion,
    responseSchema: typedTextResponse,
    timing: { prepSeconds: 0, responseSeconds: 1200 },
    media: { requiresPromptAudio: false, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'open_response',
    normalizeResponse: identity,
  },
  MCS: {
    code: 'MCS', name: 'Multiple-choice, Choose Single Answer', section: 'Reading',
    questionSchema: optionsQuestion(2),
    responseSchema: selectedOptionResponse,
    timing: { prepSeconds: 0, responseSeconds: 90 },
    media: { requiresPromptAudio: false, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  MCM: {
    code: 'MCM', name: 'Multiple-choice, Choose Multiple Answers', section: 'Reading',
    questionSchema: optionsQuestion(2),
    responseSchema: selectedMultipleResponse,
    timing: { prepSeconds: 0, responseSeconds: 120 },
    media: { requiresPromptAudio: false, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  ROP: {
    code: 'ROP', name: 'Re-order Paragraphs', section: 'Reading',
    questionSchema: z.object({ optionsJson: z.array(z.string()).min(2) }),
    responseSchema: reorderedListResponse,
    timing: { prepSeconds: 0, responseSeconds: 240 },
    media: { requiresPromptAudio: false, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  FIBR: {
    code: 'FIBR', name: 'Fill in the Blanks (Reading)', section: 'Reading',
    questionSchema: blanksQuestion,
    responseSchema: fillBlankResponse,
    timing: { prepSeconds: 0, responseSeconds: 180 },
    media: { requiresPromptAudio: false, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  FIBRW: {
    code: 'FIBRW', name: 'Fill in the Blanks (Reading & Writing)', section: 'Reading',
    questionSchema: blanksQuestion,
    responseSchema: fillBlankResponse,
    timing: { prepSeconds: 0, responseSeconds: 180 },
    media: { requiresPromptAudio: false, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  SST: {
    code: 'SST', name: 'Summarize Spoken Text', section: 'Listening',
    questionSchema: audioQuestion,
    responseSchema: typedTextResponse,
    timing: { prepSeconds: 10, responseSeconds: 600 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'open_response',
    normalizeResponse: identity,
  },
  FIBL: {
    code: 'FIBL', name: 'Fill in the Blanks (Listening)', section: 'Listening',
    questionSchema: z.object({ audioUrl: stringOpt(), promptText: stringOpt() }),
    responseSchema: fillBlankResponse,
    timing: { prepSeconds: 10, responseSeconds: 120 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  HCS: {
    code: 'HCS', name: 'Highlight Correct Summary', section: 'Listening',
    questionSchema: audioOptionsQuestion(2),
    responseSchema: selectedOptionResponse,
    timing: { prepSeconds: 10, responseSeconds: 150 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  MCSSL: {
    code: 'MCSSL', name: 'Multiple-choice, Choose Single Answer (Listening)', section: 'Listening',
    questionSchema: audioOptionsQuestion(2),
    responseSchema: selectedOptionResponse,
    timing: { prepSeconds: 10, responseSeconds: 90 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  MCMSL: {
    code: 'MCMSL', name: 'Multiple-choice, Choose Multiple Answers (Listening)', section: 'Listening',
    questionSchema: audioOptionsQuestion(2),
    responseSchema: selectedMultipleResponse,
    timing: { prepSeconds: 10, responseSeconds: 120 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  SMW: {
    code: 'SMW', name: 'Select Missing Word', section: 'Listening',
    questionSchema: audioOptionsQuestion(2),
    responseSchema: selectedOptionResponse,
    timing: { prepSeconds: 10, responseSeconds: 90 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  HIW: {
    code: 'HIW', name: 'Highlight Incorrect Words', section: 'Listening',
    questionSchema: z.object({ audioUrl: stringOpt(), promptText: stringOpt() }),
    responseSchema: highlightedIncorrectResponse,
    timing: { prepSeconds: 10, responseSeconds: 150 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
  WFD: {
    code: 'WFD', name: 'Write from Dictation', section: 'Listening',
    questionSchema: audioQuestion,
    responseSchema: typedTextResponse,
    timing: { prepSeconds: 10, responseSeconds: 60 },
    media: { requiresPromptAudio: true, requiresResponseRecording: false, requiresImage: false },
    playbackPolicy: { autoplay: true, maxPlays: 1, allowPause: true, allowSeek: false, revealTranscript: false },
    scoringMode: 'deterministic',
    normalizeResponse: identity,
  },
} satisfies Record<PTETaskCode, CanonicalTaskContract>;

export function getContract(code: PTETaskCode): CanonicalTaskContract {
  const c = TASK_REGISTRY[code];
  if (!c) throw new Error(`Unknown task code: ${code}`);
  return c;
}

export function getAllContracts(): CanonicalTaskContract[] {
  return Object.values(TASK_REGISTRY);
}

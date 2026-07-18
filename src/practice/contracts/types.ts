import { z } from 'zod';

export type PTETaskCode =
  | 'RA' | 'RS' | 'DI' | 'RL' | 'ASQ' | 'SGD' | 'RTS'
  | 'SWT' | 'WE'
  | 'MCS' | 'MCM' | 'ROP' | 'FIBR' | 'FIBRW'
  | 'SST' | 'FIBL' | 'HCS' | 'MCSSL' | 'MCMSL' | 'SMW' | 'HIW' | 'WFD';

export type PTESection = 'Speaking' | 'Writing' | 'Reading' | 'Listening';

export type ScoringMode = 'deterministic' | 'speech' | 'open_response' | 'hybrid';

export type PracticeMode = 'learning' | 'timed' | 'mock' | 'teacher_preview';

export interface TimingPolicy {
  prepSeconds: number;
  responseSeconds: number;
}

export interface PlaybackPolicy {
  autoplay: boolean;
  maxPlays: number;
  allowPause: boolean;
  allowSeek: boolean;
  revealTranscript: boolean;
}

export const MODE_PLAYBACK_MULTIPLIERS: Record<PracticeMode, number> = {
  learning: 3,
  timed: 2,
  mock: 1,
  teacher_preview: 10,
};

export interface MediaPolicy {
  requiresPromptAudio: boolean;
  requiresResponseRecording: boolean;
  requiresImage: boolean;
}

export interface CanonicalTaskContract<TQuestion = unknown, TResponse = unknown> {
  code: PTETaskCode;
  name: string;
  section: PTESection;
  questionSchema: z.ZodType<TQuestion>;
  responseSchema: z.ZodType<TResponse>;
  timing: TimingPolicy;
  media: MediaPolicy;
  playbackPolicy: PlaybackPolicy;
  scoringMode: ScoringMode;
  normalizeResponse(input: unknown): TResponse;
}

import { z } from 'zod';

export const AudioResponseSchema = z.object({
  kind: z.literal('audio'),
  audioMetadataId: z.string().optional(),
  audioUrl: z.string().optional(),
  transcript: z.string().optional(),
});

export const TextResponseSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),
});

export const SingleChoiceResponseSchema = z.object({
  kind: z.literal('single_choice'),
  selected: z.string(),
});

export const MultiChoiceResponseSchema = z.object({
  kind: z.literal('multi_choice'),
  selected: z.array(z.string()),
});

export const OrderedListResponseSchema = z.object({
  kind: z.literal('ordered_list'),
  ordered: z.array(z.string()),
});

export const BlanksResponseSchema = z.object({
  kind: z.literal('blanks'),
  blanks: z.record(z.string(), z.string()),
});

export const HighlightWordsResponseSchema = z.object({
  kind: z.literal('highlight_words'),
  words: z.array(z.string()),
});

export const NormalizedMockResponse = z.discriminatedUnion('kind', [
  AudioResponseSchema,
  TextResponseSchema,
  SingleChoiceResponseSchema,
  MultiChoiceResponseSchema,
  OrderedListResponseSchema,
  BlanksResponseSchema,
  HighlightWordsResponseSchema,
]);

export type NormalizedMockResponse = z.infer<typeof NormalizedMockResponse>;

export function createEmptyResponse(taskCode: string): NormalizedMockResponse {
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

import { z } from 'zod';

export const PTETaskCodeSchema = z.enum([
  'RA', 'RS', 'DI', 'RL', 'ASQ',
  'SWT', 'WE',
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD'
]);

export const PTESectionSchema = z.enum(['Speaking', 'Writing', 'Reading', 'Listening']);

export const MockExamQuestionSchema = z.object({
  id: z.string(), // Stable UUID set at generation
  questionId: z.string(), // Stable UUID set at generation
  questionBankItemId: z.string().optional(), // if sourced from CMS
  taskCode: PTETaskCodeSchema, // canonical
  section: z.string(), // PTESectionSchema, but keeping open for 'Resumed' or custom
  title: z.string(),
  instruction: z.string(),
  promptText: z.string(),
  promptHtml: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  optionsJson: z.string().nullable().optional(),
  difficulty: z.string(),
  source: z.enum(['cms', 'fallback']),
  version: z.number().default(1), // for immutable grading snapshots
});

export type PTETaskCode = z.infer<typeof PTETaskCodeSchema>;
export type PTESection = z.infer<typeof PTESectionSchema>;
export type MockExamQuestion = z.infer<typeof MockExamQuestionSchema>;

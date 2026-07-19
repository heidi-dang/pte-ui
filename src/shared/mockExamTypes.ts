import { z } from 'zod';

export const PTETaskCodeSchema = z.enum([
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
  'SWT', 'WE',
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD'
]);

export const PTESectionSchema = z.enum(['Speaking', 'Writing', 'Reading', 'Listening']);

export const MockExamQuestionSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  questionBankItemId: z.string().optional(),
  taskCode: PTETaskCodeSchema,
  section: z.string(),
  title: z.string(),
  instruction: z.string(),
  promptText: z.string(),
  promptHtml: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  optionsJson: z.string().nullable().optional(),
  answerKeyJson: z.string().nullable().optional(),
  sampleAnswer: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  taskPayloadJson: z.string().nullable().optional(),
  difficulty: z.string(),
  source: z.enum(['cms', 'fallback']),
  contentVersion: z.number().default(1),
  scoringPolicyVersion: z.string().default('pte-estimated-v1'),
  rubricVersion: z.string().nullable().optional(),
});

export type PTETaskCode = z.infer<typeof PTETaskCodeSchema>;
export type PTESection = z.infer<typeof PTESectionSchema>;
export type MockExamQuestion = z.infer<typeof MockExamQuestionSchema>;

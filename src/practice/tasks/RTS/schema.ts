import { z } from 'zod';

export const rtsQuestionSchema = z.object({
  promptText: z.string().min(1),
});

export const rtsResponseSchema = z.object({
  audioRecorded: z.boolean(),
});

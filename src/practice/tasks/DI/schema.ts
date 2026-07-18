import { z } from 'zod';

export const diQuestionSchema = z.object({
  imageUrl: z.string().min(1),
  promptText: z.string().min(1),
});

export const diResponseSchema = z.object({
  audioRecorded: z.boolean(),
});

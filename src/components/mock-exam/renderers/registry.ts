import type { ComponentType } from 'react';
import { type MockTaskRendererProps } from './index';
import { WritingTextRenderer } from './WritingTextRenderer';
import { SingleChoiceRenderer } from './SingleChoiceRenderer';
import { MultiChoiceRenderer } from './MultiChoiceRenderer';
import { ReorderParagraphRenderer } from './ReorderParagraphRenderer';
import { FillBlankRenderer } from './FillBlankRenderer';
import { HighlightIncorrectWordsRenderer } from './HighlightIncorrectWordsRenderer';
import { ReadAloudRenderer } from './ReadAloudRenderer';
import { RepeatSentenceRenderer } from './RepeatSentenceRenderer';
import { DescribeImageRenderer } from './DescribeImageRenderer';
import { RetellLectureRenderer } from './RetellLectureRenderer';
import { AnswerShortQuestionRenderer } from './AnswerShortQuestionRenderer';
import { SummarizeGroupDiscussionRenderer } from './SummarizeGroupDiscussionRenderer';
import { RespondToSituationRenderer } from './RespondToSituationRenderer';

export const MOCK_TASK_RENDERERS: Record<string, ComponentType<MockTaskRendererProps>> = {
  RA: ReadAloudRenderer,
  RS: RepeatSentenceRenderer,
  DI: DescribeImageRenderer,
  RL: RetellLectureRenderer,
  ASQ: AnswerShortQuestionRenderer,
  SGD: SummarizeGroupDiscussionRenderer,
  RTS: RespondToSituationRenderer,
  SWT: WritingTextRenderer,
  WE: WritingTextRenderer,
  SST: WritingTextRenderer,
  WFD: WritingTextRenderer,
  MCS: SingleChoiceRenderer,
  MCSSL: SingleChoiceRenderer,
  HCS: SingleChoiceRenderer,
  SMW: SingleChoiceRenderer,
  MCM: MultiChoiceRenderer,
  MCMSL: MultiChoiceRenderer,
  ROP: ReorderParagraphRenderer,
  FIBR: FillBlankRenderer,
  FIBRW: FillBlankRenderer,
  FIBL: FillBlankRenderer,
  HIW: HighlightIncorrectWordsRenderer,
};

export const MOCK_TASK_RENDERER_CODES = Object.keys(MOCK_TASK_RENDERERS);

export function getMockTaskRenderer(taskCode: string): ComponentType<MockTaskRendererProps> | undefined {
  return MOCK_TASK_RENDERERS[taskCode];
}

export function getAllMockTaskRendererCodes(): string[] {
  return MOCK_TASK_RENDERER_CODES;
}

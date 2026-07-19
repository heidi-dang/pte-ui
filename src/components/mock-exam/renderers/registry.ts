import type { ComponentType } from 'react';
import { type MockTaskRendererProps } from './index';
import { WritingTextRenderer } from './WritingTextRenderer';
import { SingleChoiceRenderer } from './SingleChoiceRenderer';
import { MultiChoiceRenderer } from './MultiChoiceRenderer';
import { ReorderParagraphRenderer } from './ReorderParagraphRenderer';
import { FillBlankRenderer } from './FillBlankRenderer';

export const MOCK_TASK_RENDERERS: Record<string, ComponentType<MockTaskRendererProps>> = {
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
};

export function getMockTaskRenderer(taskCode: string): ComponentType<MockTaskRendererProps> | undefined {
  return MOCK_TASK_RENDERERS[taskCode];
}

export function getAllMockTaskRendererCodes(): string[] {
  return Object.keys(MOCK_TASK_RENDERERS);
}

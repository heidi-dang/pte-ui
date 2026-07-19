export interface MockTaskRendererProps {
  question: {
    id: string;
    taskCode: string;
    section: string;
    title: string;
    instruction: string;
    promptText: string;
    promptHtml?: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
    passageText?: string | null;
    optionsJson?: string | null;
  };
  response: any;
  mode: 'practice' | 'exam';
  status: 'preparing' | 'recording' | 'answering' | 'completed';
  timers: { prepSeconds: number; responseSeconds: number };
  onChange: (response: any) => void;
  onComplete?: () => void;
}

export { SpeakingAudioRenderer } from './SpeakingAudioRenderer';
export { WritingTextRenderer } from './WritingTextRenderer';
export { SingleChoiceRenderer } from './SingleChoiceRenderer';
export { MultiChoiceRenderer } from './MultiChoiceRenderer';
export { ReorderParagraphRenderer } from './ReorderParagraphRenderer';
export { FillBlankRenderer } from './FillBlankRenderer';
export { HighlightIncorrectWordsRenderer } from './HighlightIncorrectWordsRenderer';
export { WriteFromDictationRenderer } from './WriteFromDictationRenderer';

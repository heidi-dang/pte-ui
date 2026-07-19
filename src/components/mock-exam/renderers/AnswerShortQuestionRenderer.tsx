import { SharedAudioRenderer } from './SharedAudioRenderer';
import { type MockTaskRendererProps } from './index';

export function AnswerShortQuestionRenderer(props: MockTaskRendererProps) {
  return SharedAudioRenderer(props, {}, { showPassage: false, showImage: false });
}

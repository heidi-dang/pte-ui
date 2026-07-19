import { SharedAudioRenderer } from './SharedAudioRenderer';
import { type MockTaskRendererProps } from './index';

export function RepeatSentenceRenderer(props: MockTaskRendererProps) {
  return SharedAudioRenderer(props, {}, { showPassage: false, showImage: false });
}

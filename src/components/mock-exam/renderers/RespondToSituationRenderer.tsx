import { SharedAudioRenderer } from './SharedAudioRenderer';
import { type MockTaskRendererProps } from './index';

export function RespondToSituationRenderer(props: MockTaskRendererProps) {
  return SharedAudioRenderer(props, {}, { showPassage: true, showImage: false });
}

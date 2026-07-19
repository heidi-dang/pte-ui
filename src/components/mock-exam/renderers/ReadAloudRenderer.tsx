import { SharedAudioRenderer } from './SharedAudioRenderer';
import { type MockTaskRendererProps } from './index';

export function ReadAloudRenderer(props: MockTaskRendererProps) {
  return SharedAudioRenderer(props, {}, { showPassage: true, showImage: false });
}

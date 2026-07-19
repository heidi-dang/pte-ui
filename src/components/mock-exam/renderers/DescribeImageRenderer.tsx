import { SharedAudioRenderer } from './SharedAudioRenderer';
import { type MockTaskRendererProps } from './index';

export function DescribeImageRenderer(props: MockTaskRendererProps) {
  return SharedAudioRenderer(props, {}, { showPassage: false, showImage: true });
}

import type { TaskModule } from '../types';
import { WERenderer } from './Renderer';

export const weTask: TaskModule = {
  code: 'WE',
  section: 'Writing',
  Renderer: WERenderer,
  createInitialResponse: () => ({ typedText: "" }),
  normalizeResponse: (data) => data,
};

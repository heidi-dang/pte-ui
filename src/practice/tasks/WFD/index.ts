import type { TaskModule } from '../types';
import { WFDRenderer } from './Renderer';

export const wfdTask: TaskModule = {
  code: 'WFD',
  section: 'Listening',
  Renderer: WFDRenderer,
  createInitialResponse: () => ({ typedText: "" }),
  normalizeResponse: (data) => data,
};

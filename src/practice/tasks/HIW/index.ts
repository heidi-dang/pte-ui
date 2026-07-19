import type { TaskModule } from '../types';
import { HIWRenderer } from './Renderer';

export const hiwTask: TaskModule = {
  code: 'HIW',
  section: 'Listening',
  Renderer: HIWRenderer,
  createInitialResponse: () => ({ highlightedIncorrect: [] }),
  normalizeResponse: (data) => data,
};

import type { TaskModule } from '../types';
import { FIBLRenderer } from './Renderer';

export const fiblTask: TaskModule = {
  code: 'FIBL',
  section: 'Listening',
  Renderer: FIBLRenderer,
  createInitialResponse: () => ({ blanks: {} }),
  normalizeResponse: (data) => data,
};

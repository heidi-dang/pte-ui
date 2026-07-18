import type { TaskModule } from '../types';
import { FIBRWRenderer } from './Renderer';

export const fibrwTask: TaskModule = {
  code: 'FIBRW',
  section: 'Reading',
  Renderer: FIBRWRenderer,
  createInitialResponse: () => ({ blanks: {} }),
  normalizeResponse: (data) => data,
};

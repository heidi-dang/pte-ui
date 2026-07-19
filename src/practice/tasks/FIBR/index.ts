import type { TaskModule } from '../types';
import { FIBRRenderer } from './Renderer';

export const fibrTask: TaskModule = {
  code: 'FIBR',
  section: 'Reading',
  Renderer: FIBRRenderer,
  createInitialResponse: () => ({ blanks: {} }),
  normalizeResponse: (data) => data,
};

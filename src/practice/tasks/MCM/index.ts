import type { TaskModule } from '../types';
import { MCMRenderer } from './Renderer';

export const mcmTask: TaskModule = {
  code: 'MCM',
  section: 'Reading',
  Renderer: MCMRenderer,
  createInitialResponse: () => ({ selectedMultiple: [] }),
  normalizeResponse: (data) => data,
};

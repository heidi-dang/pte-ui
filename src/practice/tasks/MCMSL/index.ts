import type { TaskModule } from '../types';
import { MCMSLRenderer } from './Renderer';

export const mcmslTask: TaskModule = {
  code: 'MCMSL',
  section: 'Listening',
  Renderer: MCMSLRenderer,
  createInitialResponse: () => ({ selectedMultiple: [] }),
  normalizeResponse: (data) => data,
};

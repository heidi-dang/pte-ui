import type { TaskModule } from '../types';
import { RLRenderer } from './Renderer';

export const rlTask: TaskModule = {
  code: 'RL',
  section: 'Speaking',
  Renderer: RLRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};

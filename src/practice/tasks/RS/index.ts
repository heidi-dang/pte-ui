import type { TaskModule } from '../types';
import { RSRenderer } from './Renderer';

export const rsTask: TaskModule = {
  code: 'RS',
  section: 'Speaking',
  Renderer: RSRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};

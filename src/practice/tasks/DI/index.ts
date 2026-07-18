import type { TaskModule } from '../types';
import { DIRenderer } from './Renderer';

export const diTask: TaskModule = {
  code: 'DI',
  section: 'Speaking',
  Renderer: DIRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};

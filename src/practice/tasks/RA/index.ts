import type { TaskModule } from '../types';
import { RARenderer } from './Renderer';

export const raTask: TaskModule = {
  code: 'RA',
  section: 'Speaking',
  Renderer: RARenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};

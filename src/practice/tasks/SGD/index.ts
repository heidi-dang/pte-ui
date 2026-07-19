import type { TaskModule } from '../types';
import { SGDRenderer } from './Renderer';

export const sgdTask: TaskModule = {
  code: 'SGD',
  section: 'Speaking',
  Renderer: SGDRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};

import type { TaskModule } from '../types';
import { MCSRenderer } from './Renderer';

export const mcsTask: TaskModule = {
  code: 'MCS',
  section: 'Reading',
  Renderer: MCSRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};

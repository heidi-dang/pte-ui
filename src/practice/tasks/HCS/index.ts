import type { TaskModule } from '../types';
import { HCSRenderer } from './Renderer';

export const hcsTask: TaskModule = {
  code: 'HCS',
  section: 'Listening',
  Renderer: HCSRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};

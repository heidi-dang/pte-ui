import type { TaskModule } from '../types';
import { SMWRenderer } from './Renderer';

export const smwTask: TaskModule = {
  code: 'SMW',
  section: 'Listening',
  Renderer: SMWRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};

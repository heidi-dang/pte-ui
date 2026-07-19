import type { TaskModule } from '../types';
import { MCSSLRenderer } from './Renderer';

export const mcsslTask: TaskModule = {
  code: 'MCSSL',
  section: 'Listening',
  Renderer: MCSSLRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};

import type { TaskModule } from '../types';
import { ASQRenderer } from './Renderer';

export const asqTask: TaskModule = {
  code: 'ASQ',
  section: 'Speaking',
  Renderer: ASQRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};

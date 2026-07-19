import type { TaskModule } from '../types';
import { RTSRenderer } from './Renderer';

export const rtsTask: TaskModule = {
  code: 'RTS',
  section: 'Speaking',
  Renderer: RTSRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};

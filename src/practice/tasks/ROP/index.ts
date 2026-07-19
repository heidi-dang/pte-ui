import type { TaskModule } from '../types';
import { ROPRenderer } from './Renderer';

export const ropTask: TaskModule = {
  code: 'ROP',
  section: 'Reading',
  Renderer: ROPRenderer,
  createInitialResponse: (item) => ({ reorderedList: item.options ? [...item.options] : [] }),
  normalizeResponse: (data) => data,
};

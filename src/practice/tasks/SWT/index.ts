import type { TaskModule } from '../types';
import { SWTRenderer } from './Renderer';

export const swtTask: TaskModule = {
  code: 'SWT',
  section: 'Writing',
  Renderer: SWTRenderer,
  createInitialResponse: () => ({ typedText: "" }),
  normalizeResponse: (data) => data,
};

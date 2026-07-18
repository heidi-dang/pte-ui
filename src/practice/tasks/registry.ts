import type { PTETaskCode } from '../../types';
import type { TaskModule } from './types';

import { raTask } from './RA';
import { rsTask } from './RS';
import { diTask } from './DI';
import { rlTask } from './RL';
import { asqTask } from './ASQ';
import { sgdTask } from './SGD';
import { rtsTask } from './RTS';
import { swtTask } from './SWT';
import { weTask } from './WE';
import { mcsTask } from './MCS';
import { mcmTask } from './MCM';
import { ropTask } from './ROP';
import { fibrTask } from './FIBR';
import { fibrwTask } from './FIBRW';
import { sstTask } from './SST';
import { mcmslTask } from './MCMSL';
import { fiblTask } from './FIBL';
import { hcsTask } from './HCS';
import { mcsslTask } from './MCSSL';
import { smwTask } from './SMW';
import { hiwTask } from './HIW';
import { wfdTask } from './WFD';

const registry = new Map<PTETaskCode, TaskModule>([
  ['RA', raTask],
  ['RS', rsTask],
  ['DI', diTask],
  ['RL', rlTask],
  ['ASQ', asqTask],
  ['SGD', sgdTask],
  ['RTS', rtsTask],
  ['SWT', swtTask],
  ['WE', weTask],
  ['MCS', mcsTask],
  ['MCM', mcmTask],
  ['ROP', ropTask],
  ['FIBR', fibrTask],
  ['FIBRW', fibrwTask],
  ['SST', sstTask],
  ['MCMSL', mcmslTask],
  ['FIBL', fiblTask],
  ['HCS', hcsTask],
  ['MCSSL', mcsslTask],
  ['SMW', smwTask],
  ['HIW', hiwTask],
  ['WFD', wfdTask],
]);

export function getTaskModule(code: PTETaskCode): TaskModule {
  const mod = registry.get(code);
  if (!mod) {
    throw new Error(`Unknown task code: ${code}`);
  }
  return mod;
}

export function getAllTaskModules(): TaskModule[] {
  return Array.from(registry.values());
}

export { registry };

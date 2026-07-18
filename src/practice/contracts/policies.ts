import { getContract } from './registry';
import type { PTETaskCode, PracticeMode, PlaybackPolicy } from './types';
import { MODE_PLAYBACK_MULTIPLIERS } from './types';

export function getEffectivePlaybackPolicy(
  taskCode: PTETaskCode,
  mode: PracticeMode,
): PlaybackPolicy {
  const contract = getContract(taskCode);
  const base = contract.playbackPolicy;
  const multiplier = MODE_PLAYBACK_MULTIPLIERS[mode] ?? 1;
  return {
    ...base,
    maxPlays: base.maxPlays * multiplier,
  };
}

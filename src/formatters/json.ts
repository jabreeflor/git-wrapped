import type { WrappedStats } from '../types.js';

export function formatJson(stats: WrappedStats): string {
  return JSON.stringify(stats, null, 2);
}

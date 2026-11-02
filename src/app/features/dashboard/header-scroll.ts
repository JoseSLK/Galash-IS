/**
 * Compact-header state with hysteresis: small scroll oscillations (trackpad
 * inertia, momentum bounce) never toggle it.
 */
export interface HeaderScrollState { compact: boolean; anchorY: number; lastY: number; direction: -1 | 0 | 1; }

export const HEADER_SCROLL = {
  /** Always expanded near the top. */ top: 48,
  /** Never compact before this offset. */ compactAfter: 96,
  /** Distance scrolled down since the last reversal before compacting. */ down: 24,
  /** Distance scrolled up since the last reversal before expanding. */ up: 48
} as const;

export const INITIAL_HEADER_SCROLL: HeaderScrollState = { compact: false, anchorY: 0, lastY: 0, direction: 0 };

export function nextHeaderState(state: HeaderScrollState, y: number): HeaderScrollState {
  const direction = y > state.lastY ? 1 : y < state.lastY ? -1 : state.direction;
  const anchorY = direction !== state.direction ? state.lastY : state.anchorY;
  let compact = state.compact;
  if (y < HEADER_SCROLL.top) compact = false;
  else if (!compact && y > HEADER_SCROLL.compactAfter && y - anchorY >= HEADER_SCROLL.down) compact = true;
  else if (compact && anchorY - y >= HEADER_SCROLL.up) compact = false;
  return { compact, anchorY, lastY: y, direction };
}

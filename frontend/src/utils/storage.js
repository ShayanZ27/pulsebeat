/** JSON localStorage helpers that never throw (private mode, quota, bad JSON). */

export function readStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full — persistence is best-effort */
  }
}

export const STORAGE_KEYS = {
  user: 'pulsebeat:user',
  theme: 'pulsebeat:theme',
  // Player state is namespaced per user so accounts sharing a browser never
  // inherit each other's queue.
  player: (userId) => `pulsebeat:player:${userId}`,
  playerTime: (userId) => `pulsebeat:player-time:${userId}`,
};

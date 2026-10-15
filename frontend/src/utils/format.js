/** 245 -> "4:05". Durations are stored as seconds in the database. */
export function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const RELATIVE_UNITS = [
  { limit: 60, divisor: 1, suffix: 's' },
  { limit: 3600, divisor: 60, suffix: 'm' },
  { limit: 86400, divisor: 3600, suffix: 'h' },
  { limit: 604800, divisor: 86400, suffix: 'd' },
  { limit: Infinity, divisor: 604800, suffix: 'w' },
];

/** ISO date -> "2m ago" / "just now". */
export function formatRelativeTime(date) {
  const elapsed = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (elapsed < 30) return 'just now';
  const unit = RELATIVE_UNITS.find(({ limit }) => elapsed < limit);
  return `${Math.floor(elapsed / unit.divisor)}${unit.suffix} ago`;
}

/** "Good morning" / "Good afternoon" / "Good evening" based on local time. */
export function getGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Human display name for a populated user/artist document. */
export function getDisplayName(person, fallback = 'Unknown Artist') {
  if (!person || typeof person !== 'object') return fallback;
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || fallback;
}

/** Initials for avatar fallbacks: "The Weeknd" -> "TW". */
export function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';
}

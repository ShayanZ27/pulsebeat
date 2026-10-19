import { useEffect } from 'react';

/** Calls `onOutside` when a mousedown happens outside `ref` (while `active`). */
export function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      if (ref.current && ref.current.contains(event.target)) return;
      if (
        event.target &&
        event.target.closest &&
        (event.target.closest('[data-track-action-menu="true"]') ||
          event.target.closest('[data-track-action-menu-trigger="true"]') ||
          event.target.closest('[data-add-to-playlist-modal="true"]') ||
          event.target.closest('.track-action-menu-portal'))
      ) {
        return;
      }
      onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside, active]);
}

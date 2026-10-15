import { useSyncExternalStore } from 'react';
import { BREAKPOINTS } from '../constants/theme';

function subscribe(notify) {
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
}

/**
 * Coarse breakpoint tier. Returning a string (rather than the raw width) means
 * consumers only re-render when the tier actually changes, not on every
 * pixel of a resize.
 */
function getTier() {
  const width = window.innerWidth;
  if (width >= BREAKPOINTS.largeDesktop) return 'large';
  if (width >= BREAKPOINTS.desktop) return 'medium';
  return 'mobile';
}

export function useBreakpoint() {
  const tier = useSyncExternalStore(subscribe, getTier, () => 'large');
  return {
    isLargeDesktop: tier === 'large',
    isMediumDesktop: tier === 'medium',
    isMobile: tier === 'mobile',
  };
}

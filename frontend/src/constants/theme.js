/** Accent palette offered in the theme picker. */
export const ACCENT_THEMES = {
  lime: '#C6F24E',
  cyan: '#22D3EE',
  purple: '#8B5CF6',
  coral: '#FF6B6B',
  gold: '#F59E0B',
  red: '#EF4444',
  pink: '#EC4899',
  blue: '#3B82F6',
  emerald: '#10B981',
  white: '#FFFFFF',
};

export const DEFAULT_ACCENT = ACCENT_THEMES.lime;

/** Monochrome option resolves to black/white depending on the colour scheme. */
export const MONOCHROME_ACCENT = ACCENT_THEMES.white;

/** Dot colours cycled through for the sidebar playlist list. */
export const PLAYLIST_DOT_COLORS = ['#C6F24E', '#8B5CF6', '#EF4444', '#3B82F6', '#EC4899', '#22D3EE', '#F59E0B'];

/** Responsive breakpoints (px) used by the layout. */
export const BREAKPOINTS = {
  desktop: 1024,
  largeDesktop: 1440,
};

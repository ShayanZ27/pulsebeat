import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_ACCENT, MONOCHROME_ACCENT } from '../constants/theme';
import { contrastText } from '../utils/color';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';

const themeSlice = createSlice({
  name: 'theme',
  initialState: () => {
    const saved = readStorage(STORAGE_KEYS.theme);
    return {
      isDark: saved?.isDark ?? false,
      selectedTheme: saved?.selectedTheme ?? DEFAULT_ACCENT,
    };
  },
  reducers: {
    toggleDark(state) {
      state.isDark = !state.isDark;
    },
    setAccent(state, { payload }) {
      state.selectedTheme = payload;
    },
  },
});

export const { toggleDark, setAccent } = themeSlice.actions;

export const selectIsDark = (state) => state.theme.isDark;
export const selectSelectedTheme = (state) => state.theme.selectedTheme;

/** Monochrome resolves to black on light backgrounds and white on dark ones. */
export const selectAccentColor = (state) => {
  const { selectedTheme, isDark } = state.theme;
  if (selectedTheme !== MONOCHROME_ACCENT) return selectedTheme;
  return isDark ? '#FFFFFF' : '#000000';
};

export const selectAccentTextColor = (state) => contrastText(selectAccentColor(state));

/** Persists the theme and applies it to <html>. Called by the store listener. */
export function applyTheme(state) {
  writeStorage(STORAGE_KEYS.theme, state.theme);
  document.documentElement.classList.toggle('dark', state.theme.isDark);
  document.documentElement.style.setProperty('--accent-color', selectAccentColor(state));
}

export default themeSlice.reducer;

import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import audio from '../audio/audioElement';
import { STORAGE_KEYS, writeStorage } from '../utils/storage';
import { pulsebeatApi } from './api';
import authReducer from './authSlice';
import playerReducer, { hydratePlayer, loadPersistedPlayerState, resetPlayer } from './playerSlice';
import themeReducer, { applyTheme } from './themeSlice';

/* Side effects live here (not in component effects) so they run exactly once
   per state change, regardless of which components are mounted. */
const listener = createListenerMiddleware();

listener.startListening({
  predicate: (_action, current, previous) => current.theme !== previous.theme,
  effect: (_action, { getState }) => applyTheme(getState()),
});

listener.startListening({
  predicate: (_action, current, previous) => current.auth.user !== previous.auth.user,
  effect: (_action, { getState, dispatch }) => {
    const { user } = getState().auth;
    writeStorage(STORAGE_KEYS.user, user);

    if (user) {
      // Hydrate the player state belonging to this user
      dispatch(hydratePlayer(loadPersistedPlayerState(user._id)));
    } else {
      // Session ended: drop cached server data and reset player queue
      dispatch(pulsebeatApi.util.resetApiState());
      dispatch(resetPlayer());
      audio.pause();
    }
  },
});

listener.startListening({
  predicate: (_action, current, previous) => current.player !== previous.player,
  effect: (_action, { getState }) => {
    const { auth, player } = getState();
    const userId = auth.user?._id;
    if (!userId) return;

    const { queue, originalQueue, currentIndex, volume, isMuted, repeatMode, isShuffle } = player;
    writeStorage(STORAGE_KEYS.player(userId), {
      queue,
      originalQueue,
      currentIndex,
      volume,
      isMuted,
      repeatMode,
      isShuffle,
    });
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    player: playerReducer,
    [pulsebeatApi.reducerPath]: pulsebeatApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listener.middleware).concat(pulsebeatApi.middleware),
});

// Apply the persisted theme before the first render (avoids a colour flash).
applyTheme(store.getState());
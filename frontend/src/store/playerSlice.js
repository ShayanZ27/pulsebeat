import { createSlice } from '@reduxjs/toolkit';
import { getAudioCurrentTime, seek } from '../audio/audioElement';
import { readStorage, STORAGE_KEYS } from '../utils/storage';
import { shuffleArray } from '../utils/track';

const REPEAT_MODES = ['off', 'all', 'one'];
const RESTART_THRESHOLD_SECONDS = 3;
const MAX_QUEUE_SIZE = 40;
const HISTORY_BUFFER = 5;

/** Quietly clears old played tracks from the front of the queue if exceeding MAX_QUEUE_SIZE */
function pruneQueue(state) {
  if (!Array.isArray(state.queue) || state.queue.length <= MAX_QUEUE_SIZE) return;
  const maxPrunable = Math.max(0, state.currentIndex - HISTORY_BUFFER);
  if (maxPrunable <= 0) return;

  const excess = state.queue.length - MAX_QUEUE_SIZE;
  const pruneCount = Math.min(excess, maxPrunable);
  if (pruneCount <= 0) return;

  const pruned = state.queue.splice(0, pruneCount);
  state.currentIndex -= pruneCount;

  if (Array.isArray(state.originalQueue)) {
    const prunedIds = new Set(pruned.map((t) => t?._id || t?.id).filter(Boolean));
    state.originalQueue = state.originalQueue.filter((t) => !prunedIds.has(t?._id || t?.id));
  }
}

export const DEFAULT_PLAYER_STATE = {
  queue: [],
  originalQueue: [],
  currentIndex: -1,
  isPlaying: false,
  volume: 0.7,
  isMuted: false,
  repeatMode: 'off',
  isShuffle: false,
  playRequestId: 0,
  isFullScreen: false,
};

export function loadPersistedPlayerState(userId) {
  if (!userId) return DEFAULT_PLAYER_STATE;
  const storageKey = STORAGE_KEYS.player(userId);
  const saved = readStorage(storageKey);
  if (!saved || !Array.isArray(saved.queue)) return DEFAULT_PLAYER_STATE;

  const lastIndex = saved.queue.length - 1;
  return {
    ...DEFAULT_PLAYER_STATE,
    queue: saved.queue,
    originalQueue: Array.isArray(saved.originalQueue) ? saved.originalQueue : saved.queue,
    currentIndex: lastIndex < 0 ? -1 : Math.min(Math.max(saved.currentIndex ?? 0, 0), lastIndex),
    volume: typeof saved.volume === 'number' ? saved.volume : DEFAULT_PLAYER_STATE.volume,
    isMuted: Boolean(saved.isMuted),
    repeatMode: REPEAT_MODES.includes(saved.repeatMode) ? saved.repeatMode : 'off',
    isShuffle: Boolean(saved.isShuffle),
    isPlaying: false, // browsers block autoplay on load; user must resume
  };
}

function removeFirstById(tracks, id) {
  if (!Array.isArray(tracks) || !id) return tracks || [];
  const index = tracks.findIndex((track) => (track._id || track.id) === id);
  return index === -1 ? tracks : [...tracks.slice(0, index), ...tracks.slice(index + 1)];
}

const playerSlice = createSlice({
  name: 'player',
  initialState: () => {
    const savedUser = readStorage(STORAGE_KEYS.user);
    return loadPersistedPlayerState(savedUser?._id);
  },
  reducers: {
    loadQueue(state, { payload }) {
      state.queue = payload.queue;
      state.originalQueue = payload.originalQueue;
      state.currentIndex = payload.currentIndex;
      state.isPlaying = true;
      state.playRequestId += 1;
      pruneQueue(state);
    },
    jumpTo(state, { payload: index }) {
      state.currentIndex = index;
      state.isPlaying = true;
      state.playRequestId += 1;
      pruneQueue(state);
    },
    setPlaying(state, { payload: isPlaying }) {
      state.isPlaying = isPlaying;
    },
    setVolume(state, { payload: volume }) {
      const clamped = Math.min(Math.max(volume, 0), 1);
      state.volume = clamped;
      state.isMuted = clamped === 0;
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    cycleRepeat(state) {
      const nextIndex = (REPEAT_MODES.indexOf(state.repeatMode) + 1) % REPEAT_MODES.length;
      state.repeatMode = REPEAT_MODES[nextIndex];
    },
    setFullScreen(state, { payload }) {
      state.isFullScreen = Boolean(payload);
    },
    toggleFullScreen(state) {
      state.isFullScreen = !state.isFullScreen;
    },
    setShuffle(state, { payload }) {
      state.isShuffle = payload.isShuffle;
      state.queue = payload.queue;
      state.currentIndex = payload.currentIndex;
    },
    addToQueue(state, { payload }) {
      if (!payload) return;
      const tracksToAdd = Array.isArray(payload) ? payload : [payload];
      for (const track of tracksToAdd) {
        if (!track) continue;
        const trackId = track._id || track.id;
        if (trackId && state.queue.some((t) => (t._id || t.id) === trackId)) {
          continue;
        }
        state.queue.push(track);
        state.originalQueue.push(track);
      }
      if (state.currentIndex === -1 && state.queue.length > 0) state.currentIndex = 0;
      pruneQueue(state);
    },
    playNext(state, { payload }) {
      if (!payload) return;
      const tracksToInsert = Array.isArray(payload) ? payload : [payload];
      if (!tracksToInsert.length) return;

      if (state.queue.length === 0 || state.currentIndex === -1) {
        state.queue = [...tracksToInsert];
        state.originalQueue = [...tracksToInsert];
        state.currentIndex = 0;
        state.isPlaying = true;
        state.playRequestId += 1;
        pruneQueue(state);
        return;
      }

      // Remove existing duplicates of tracksToInsert from the queue (except the currently playing song)
      const idsToInsert = new Set(tracksToInsert.map((t) => t._id || t.id).filter(Boolean));
      const newQueue = [];
      let newCurrentIndex = state.currentIndex;

      for (let i = 0; i < state.queue.length; i++) {
        const item = state.queue[i];
        const itemId = item._id || item.id;
        if (i !== state.currentIndex && idsToInsert.has(itemId)) {
          if (i < state.currentIndex) {
            newCurrentIndex -= 1;
          }
          continue;
        }
        newQueue.push(item);
      }

      // Insert immediately after the current song
      const insertPosition = newCurrentIndex + 1;
      newQueue.splice(insertPosition, 0, ...tracksToInsert);

      state.queue = newQueue;
      state.currentIndex = newCurrentIndex;

      if (!state.isShuffle) {
        state.originalQueue = [...newQueue];
      }
      pruneQueue(state);
    },
    appendAndPlay(state, { payload: track }) {
      if (!track) return;
      const trackId = track._id || track.id;

      if (!state.queue.length || state.currentIndex === -1) {
        state.queue = [track];
        state.originalQueue = [track];
        state.currentIndex = 0;
        state.isPlaying = true;
        state.playRequestId += 1;
        return;
      }

      const current = state.queue[state.currentIndex];
      if (current && (current._id || current.id) === trackId) {
        state.isPlaying = true;
        return;
      }

      let newCurrentIndex = state.currentIndex;
      const existingIndex = state.queue.findIndex(
        (t, idx) => idx !== state.currentIndex && (t._id || t.id) === trackId
      );

      if (existingIndex !== -1) {
        state.queue.splice(existingIndex, 1);
        if (existingIndex < state.currentIndex) {
          newCurrentIndex -= 1;
        }
        if (Array.isArray(state.originalQueue)) {
          const origIdx = state.originalQueue.findIndex((t) => (t._id || t.id) === trackId);
          if (origIdx !== -1) {
            state.originalQueue.splice(origIdx, 1);
          }
        }
      }

      const insertIndex = newCurrentIndex + 1;
      state.queue.splice(insertIndex, 0, track);
      state.currentIndex = insertIndex;
      state.isPlaying = true;
      state.playRequestId += 1;

      if (!state.isShuffle) {
        state.originalQueue = [...state.queue];
      } else {
        state.originalQueue.push(track);
      }

      pruneQueue(state);
    },
    removeFromQueue(state, { payload: index }) {
      if (typeof index !== 'number' || index < 0 || index >= state.queue.length) return;
      const removed = state.queue[index];
      if (!removed) return;

      const trackId = removed._id || removed.id;
      state.queue.splice(index, 1);
      state.originalQueue = removeFirstById(state.originalQueue, trackId);

      if (state.queue.length === 0) {
        state.currentIndex = -1;
        state.isPlaying = false;
        state.playRequestId += 1;
      } else if (index < state.currentIndex) {
        state.currentIndex -= 1;
      } else if (index === state.currentIndex) {
        if (state.currentIndex >= state.queue.length) {
          state.currentIndex = state.queue.length - 1;
        }
        state.playRequestId += 1;
      }
    },
    reorderQueue(state, { payload }) {
      const { sourceIndex, destinationIndex } = payload;
      if (
        typeof sourceIndex !== 'number' ||
        typeof destinationIndex !== 'number' ||
        sourceIndex < 0 ||
        sourceIndex >= state.queue.length ||
        destinationIndex < 0 ||
        destinationIndex >= state.queue.length ||
        sourceIndex === destinationIndex
      ) {
        return;
      }

      const [moved] = state.queue.splice(sourceIndex, 1);
      state.queue.splice(destinationIndex, 0, moved);

      // Keep currentIndex pointing to the currently active track
      if (state.currentIndex === sourceIndex) {
        state.currentIndex = destinationIndex;
      } else if (sourceIndex < state.currentIndex && destinationIndex >= state.currentIndex) {
        state.currentIndex -= 1;
      } else if (sourceIndex > state.currentIndex && destinationIndex <= state.currentIndex) {
        state.currentIndex += 1;
      }

      // Also update originalQueue if not in shuffle mode
      if (!state.isShuffle) {
        const trackId = moved._id || moved.id;
        const origSourceIndex = state.originalQueue.findIndex((t) => (t._id || t.id) === trackId);
        if (origSourceIndex !== -1) {
          const [origMoved] = state.originalQueue.splice(origSourceIndex, 1);
          state.originalQueue.splice(destinationIndex, 0, origMoved);
        }
      }
    },
    clearQueue(state) {
      const current = state.queue[state.currentIndex];
      if (current) {
        state.queue = [current];
        state.originalQueue = [current];
        state.currentIndex = 0;
      } else {
        state.queue = [];
        state.originalQueue = [];
        state.currentIndex = -1;
        state.isPlaying = false;
      }
    },
    hydratePlayer(_state, { payload }) {
      return payload;
    },
    resetPlayer() {
      return DEFAULT_PLAYER_STATE;
    },
  },
});

export const {
  loadQueue,
  jumpTo,
  setPlaying,
  setVolume,
  toggleMute,
  cycleRepeat,
  setFullScreen,
  toggleFullScreen,
  setShuffle,
  addToQueue,
  playNext,
  appendAndPlay,
  removeFromQueue,
  reorderQueue,
  clearQueue,
  hydratePlayer,
  resetPlayer,
} = playerSlice.actions;

function deduplicateTracks(tracks) {
  if (!Array.isArray(tracks)) return [];
  const seen = new Set();
  return tracks.filter((track) => {
    const id = track?._id || track?.id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export const playTracks = (tracks, startIndex = 0) => (dispatch, getState) => {
  if (!tracks?.length) return;
  const rawTarget = tracks[Math.min(Math.max(startIndex, 0), tracks.length - 1)];
  const cleanTracks = deduplicateTracks(tracks);
  if (!cleanTracks.length) return;

  const targetId = rawTarget?._id || rawTarget?.id;
  const newIndex = targetId ? cleanTracks.findIndex((t) => (t._id || t.id) === targetId) : 0;
  const start = Math.max(0, newIndex);
  const { isShuffle } = getState().player;

  if (isShuffle) {
    const rest = cleanTracks.filter((_, i) => i !== start);
    dispatch(
      loadQueue({
        queue: [cleanTracks[start], ...shuffleArray(rest)],
        originalQueue: cleanTracks,
        currentIndex: 0,
      }),
    );
  } else {
    dispatch(
      loadQueue({
        queue: cleanTracks,
        originalQueue: cleanTracks,
        currentIndex: start,
      }),
    );
  }
};

/**
 * Universal playTrack:
 * - If contextTracks is provided with multiple items, treat as collection play starting at track.
 * - If standalone track (no context), perform Append & Jump without wiping the existing queue.
 */
export const playTrack = (track, contextTracks) => (dispatch) => {
  if (!track) return;
  if (Array.isArray(contextTracks) && contextTracks.length > 1) {
    const cleanTracks = deduplicateTracks(contextTracks);
    const targetId = track?._id || track?.id;
    const index = targetId ? cleanTracks.findIndex((t) => (t._id || t.id) === targetId) : 0;
    dispatch(playTracks(cleanTracks, Math.max(index, 0)));
  } else {
    dispatch(appendAndPlay(track));
  }
};

/** Standalone track playback with Append & Jump (keeps existing queue intact) */
export const playSingleTrack = (track) => (dispatch) => {
  if (!track) return;
  dispatch(appendAndPlay(track));
};

/** Semantic alias for playing an album, playlist, or list collection */
export const playCollection = playTracks;

export const togglePlay = () => (dispatch, getState) => {
  const { queue, currentIndex, isPlaying } = getState().player;
  if (!queue[currentIndex]) return;
  dispatch(setPlaying(!isPlaying));
};

export const nextTrack = ({ auto = false } = {}) => (dispatch, getState) => {
  const { queue, currentIndex, repeatMode } = getState().player;
  if (!queue.length) return;

  if (currentIndex < queue.length - 1) {
    dispatch(jumpTo(currentIndex + 1));
  } else if (repeatMode === 'all') {
    dispatch(jumpTo(0));
  } else if (auto) {
    dispatch(setPlaying(false));
    seek(0);
  }
};

export const prevTrack = () => (dispatch, getState) => {
  const { currentIndex } = getState().player;
  const currentTime = getAudioCurrentTime();

  if (currentTime > RESTART_THRESHOLD_SECONDS || currentIndex <= 0) {
    seek(0);
  } else {
    dispatch(jumpTo(currentIndex - 1));
  }
};

export const toggleShuffleMode = () => (dispatch, getState) => {
  const { isShuffle, queue, originalQueue, currentIndex } = getState().player;
  const current = queue[currentIndex];

  if (!isShuffle) {
    const rest = queue.filter((_, i) => i !== currentIndex);
    const shuffled = current ? [current, ...shuffleArray(rest)] : shuffleArray(rest);
    dispatch(
      setShuffle({
        isShuffle: true,
        queue: shuffled,
        currentIndex: current ? 0 : -1,
      }),
    );
  } else {
    const restoredIndex = current ? originalQueue.findIndex((t) => t._id === current._id) : -1;
    dispatch(
      setShuffle({
        isShuffle: false,
        queue: originalQueue,
        currentIndex: originalQueue.length ? Math.max(restoredIndex, 0) : -1,
      }),
    );
  }
};

/* ── Selectors ── */
export const selectQueue = (state) => state.player.queue;
export const selectCurrentIndex = (state) => state.player.currentIndex;
export const selectCurrentTrack = (state) => state.player.queue[state.player.currentIndex] ?? null;
export const selectIsPlaying = (state) => state.player.isPlaying;
export const selectVolume = (state) => state.player.volume;
export const selectIsMuted = (state) => state.player.isMuted;
export const selectRepeatMode = (state) => state.player.repeatMode;
export const selectIsShuffle = (state) => state.player.isShuffle;
export const selectPlayRequestId = (state) => state.player.playRequestId;
export const selectIsFullScreen = (state) => Boolean(state.player.isFullScreen);

export default playerSlice.reducer;

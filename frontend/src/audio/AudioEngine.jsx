import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRecordPlayMutation } from '../store/api';
import { selectCurrentUser } from '../store/authSlice';
import {
  nextTrack,
  prevTrack,
  selectCurrentTrack,
  selectIsMuted,
  selectIsPlaying,
  selectPlayRequestId,
  selectRepeatMode,
  selectVolume,
  setPlaying,
} from '../store/playerSlice';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';
import audio, { seek } from './audioElement';

const TIME_PERSIST_INTERVAL_MS = 2000;

/**
 * Headless synchronization component that mounts once in the app shell.
 * Connects the HTML5 audio element to the Redux player state and handles:
 * - Loading media URLs and handling repeat playback
 * - Restoring & throttle-saving playback position to localStorage
 * - Counting plays via RTK Query mutation on playback start
 * - MediaSession lockscreen / keyboard media key controls
 */
export default function AudioEngine() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);
  const volume = useSelector(selectVolume);
  const isMuted = useSelector(selectIsMuted);
  const repeatMode = useSelector(selectRepeatMode);
  const playRequestId = useSelector(selectPlayRequestId);

  const [recordPlay] = useRecordPlayMutation();

  const loadedTrackIdRef = useRef(null);
  const hasRestoredRef = useRef(false);
  const hasRecordedPlayRef = useRef(false);
  const currentTrackRef = useRef(currentTrack);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const trackId = currentTrack?._id;
  const trackUri = currentTrack?.uri;
  const userId = user?._id;
  const timeKey = STORAGE_KEYS.playerTime(userId);

  /* ── Load the current track into the <audio> element ── */
  useEffect(() => {
    hasRecordedPlayRef.current = false;

    if (!trackId) {
      loadedTrackIdRef.current = null;
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    if (loadedTrackIdRef.current === trackId) {
      seek(0);
      return;
    }

    loadedTrackIdRef.current = trackId;
    audio.src = trackUri;

    // Restore saved position once for the track saved prior to page reload
    if (!hasRestoredRef.current) {
      hasRestoredRef.current = true;
      const restorePoint = readStorage(timeKey);
      if (restorePoint?.trackId === trackId && restorePoint.time > 0) {
        audio.addEventListener('loadedmetadata', () => { seek(restorePoint.time); }, { once: true });
      }
    }
  }, [trackId, trackUri, playRequestId, timeKey]);

  /* ── Drive play/pause from state ── */
  useEffect(() => {
    if (!trackId) return;
    if (isPlaying) {
      audio.play()?.catch((error) => {
        if (error.name !== 'AbortError') {
          dispatch(setPlaying(false));
        }
      });
    } else {
      audio.pause();
    }
  }, [trackId, isPlaying, playRequestId, dispatch]);

  /* ── Volume & Mute ── */
  useEffect(() => {
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  /* ── Loop mode ── */
  useEffect(() => {
    audio.loop = repeatMode === 'one';
  }, [repeatMode]);

  /* ── Audio element events -> Redux & Backend ── */
  useEffect(() => {
    const syncPlaying = () => dispatch(setPlaying(true));
    const syncPaused = () => dispatch(setPlaying(false));

    const onPlaying = () => {
      const track = currentTrackRef.current;
      if (!track || hasRecordedPlayRef.current) return;
      hasRecordedPlayRef.current = true;
      recordPlay(track._id).catch(() => {
        hasRecordedPlayRef.current = false;
      });
    };

    const onEnded = () => {
      dispatch(nextTrack({ auto: true }));
    };

    audio.addEventListener('play', syncPlaying);
    audio.addEventListener('pause', syncPaused);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', syncPlaying);
      audio.removeEventListener('pause', syncPaused);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
    };
  }, [dispatch, recordPlay]);

  /* ── Position persistence ── */
  useEffect(() => {
    let lastSavedAt = 0;
    const savePosition = () => {
      const track = currentTrackRef.current;
      if (!track || audio.readyState < 1) return;
      writeStorage(timeKey, { trackId: track._id, time: audio.currentTime });
    };

    const onTimeUpdate = () => {
      const now = Date.now();
      if (now - lastSavedAt >= TIME_PERSIST_INTERVAL_MS) {
        lastSavedAt = now;
        savePosition();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    window.addEventListener('pagehide', savePosition);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      window.removeEventListener('pagehide', savePosition);
    };
  }, [timeKey]);

  /* ── Media Session API ── */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      artwork: currentTrack.coverImage ? [{ src: currentTrack.coverImage, sizes: '512x512' }] : [],
    });
  }, [currentTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined;

    const handlers = {
      play: () => dispatch(setPlaying(true)),
      pause: () => dispatch(setPlaying(false)),
      nexttrack: () => dispatch(nextTrack()),
      previoustrack: () => dispatch(prevTrack()),
    };

    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions might not be supported on all browsers
      }
    });

    return () => {
      Object.keys(handlers).forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      });
    };
  }, [dispatch]);

  /* ── Teardown ── */
  useEffect(() => () => audio.pause(), []);

  return null;
}

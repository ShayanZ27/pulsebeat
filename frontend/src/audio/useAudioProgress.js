import { useCallback, useSyncExternalStore } from 'react';
import audio from './audioElement';

const PROGRESS_EVENTS = ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked', 'emptied'];

/**
 * High-frequency playback progress hook directly reading the <audio> element.
 * Kept out of Redux state so ~4 updates/sec only re-render the components
 * calling this hook (e.g. ProgressBar), not the entire application tree.
 */
export function useAudioProgress() {
  const subscribe = useCallback((notify) => {
    PROGRESS_EVENTS.forEach((event) => audio.addEventListener(event, notify));
    return () => PROGRESS_EVENTS.forEach((event) => audio.removeEventListener(event, notify));
  }, []);

  const currentTime = useSyncExternalStore(subscribe, () => audio.currentTime, () => 0);
  const duration = useSyncExternalStore(subscribe, () => (Number.isFinite(audio.duration) ? audio.duration : 0), () => 0);

  return { currentTime, duration };
}

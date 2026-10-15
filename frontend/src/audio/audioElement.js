/**
 * Module-level singleton HTMLAudioElement.
 * Kept outside Redux since HTMLMediaElement is non-serializable DOM state.
 */
const audio = new Audio();
audio.preload = 'metadata';

export default audio;

export function seek(seconds) {
  if (Number.isFinite(seconds)) {
    audio.currentTime = Math.max(0, seconds);
  }
}

export function getAudioCurrentTime() {
  return audio.currentTime;
}

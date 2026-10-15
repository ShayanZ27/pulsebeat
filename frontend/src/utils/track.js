import { getDisplayName } from './format';

/**
 * Converts a Music document from the API into the compact shape the player
 * works with. Keeping tracks small matters because the queue is persisted to
 * localStorage on every change.
 *
 * @returns {{ _id: string, title: string, artistName: string, coverImage: string, uri: string, duration: number } | null}
 */
export function toTrack(music) {
  if (!music?._id || !music.uri) return null;
  return {
    _id: music._id,
    title: music.title,
    artistName: getDisplayName(music.artist),
    coverImage: music.coverImage,
    uri: music.uri,
    duration: music.duration ?? 0,
  };
}

/** Maps a list of Music documents to playable tracks, dropping invalid entries. */
export function toTracks(musicList = []) {
  return musicList.map(toTrack).filter(Boolean);
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffleArray(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

import { getDisplayName } from './format';

/** Filter tabs for the full feed (keys match Activity.targetType). */
export const ACTIVITY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'music', label: 'Tracks' },
  { key: 'album', label: 'Albums' },
  { key: 'playlist', label: 'Playlists' },
];

/**
 * Turns a raw feed entry into everything the UI needs:
 * a human sentence, artwork, the content link and the primary action.
 *
 * kind:       'track' | 'album' | 'playlist'
 * actionType: 'play' (songs) | 'open' (albums & playlists)
 * badge:      'like' | 'release' | 'add'  (drives the avatar mini-badge)
 */
export function describeActivity(activity) {
  const { action, targetType, target, related, relatedCount = 1 } = activity || {};
  if (!target) return null;

  const base = {
    id: activity._id,
    user: activity.user,
    userName: getDisplayName(activity.user, 'Someone'),
    isArtist: activity.user?.role === 'artist',
    createdAt: activity.createdAt,
    filterKey: targetType,
  };

  if (targetType === 'music') {
    return {
      ...base,
      kind: 'track',
      badge: action === 'uploaded_music' ? 'release' : 'like',
      verb: action === 'uploaded_music' ? 'dropped a new track' : 'liked a track',
      title: target.title || 'Untitled track',
      subtitle: getDisplayName(target.artist, 'Unknown Artist'),
      cover: target.coverImage || '',
      actionType: 'play',
      track: target,
      href: target.album ? `/album/${target.album}` : null,
    };
  }

  if (targetType === 'album') {
    return {
      ...base,
      kind: 'album',
      badge: action === 'uploaded_album' ? 'release' : 'like',
      verb: action === 'uploaded_album' ? 'released an album' : 'liked an album',
      title: target.title || 'Untitled album',
      subtitle: getDisplayName(target.artist, 'Unknown Artist'),
      cover: target.coverImage || '',
      actionType: 'open',
      href: `/album/${target._id}`,
    };
  }

  // Playlists
  const isAdd = action === 'added_to_playlist';
  const songCount = target.songCount ?? 0;
  let verb = 'liked a playlist';
  if (isAdd) {
    verb = relatedCount > 1 ? `added ${relatedCount} tracks to` : 'added a track to';
  }

  return {
    ...base,
    kind: 'playlist',
    badge: isAdd ? 'add' : 'like',
    verb,
    title: target.name || 'Untitled playlist',
    subtitle: isAdd && related
      ? related.title
      : `${songCount} ${songCount === 1 ? 'track' : 'tracks'}${target.owner ? ` · by ${getDisplayName(target.owner, '')}` : ''}`,
    cover: target.coverImage || related?.coverImage || '',
    actionType: 'open',
    href: `/playlist/${target._id}`,
    // The song that was added, playable straight from the feed
    relatedTrack: isAdd && related?.uri ? related : null,
  };
}

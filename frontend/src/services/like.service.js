import api, { unwrap } from './api';

export const likeService = {
  addLike: ({ id, targetId, targetType = 'music' }) => {
    const realId = id || targetId;
    return api.post(`/like/${realId}`, { targetType }).then(unwrap);
  },
  removeLike: ({ id, targetId, targetType = 'music' }) => {
    const realId = id || targetId;
    return api.delete(`/like/${realId}`, { data: { targetType }, params: { targetType } }).then(unwrap);
  },
  getLikedMusic: () =>
    api.get('/like/liked-music').then(unwrap),
  getLikedAlbums: () =>
    api.get('/like/liked-album').then(unwrap),
  getLikedPlaylists: () =>
    api.get('/like/liked-playlists').then(unwrap),
};

import api, { unwrap } from './api';

export const likeService = {
  addLike: ({ id, targetType = 'music' }) =>
    api.post(`/like/${id}`, { targetType }).then(unwrap),
  removeLike: ({ id, targetType = 'music' }) =>
    api.delete(`/like/${id}`, { data: { targetType }, params: { targetType } }).then(unwrap),
  getLikedMusic: () =>
    api.get('/like/liked-music').then(unwrap),
  getLikedAlbums: () =>
    api.get('/like/liked-album').then(unwrap),
};

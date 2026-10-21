import api, { unwrap, unwrapWithPagination } from './api';

export const playlistService = {
  getUserPlaylists: () => api.get('/playlist').then(unwrap),
  getCommunity: (arg = 20) => {
    if (typeof arg === 'object' && arg !== null) {
      return api.get('/playlist/community', { params: arg }).then(unwrapWithPagination);
    }
    const limit = typeof arg === 'number' ? arg : 20;
    return api.get('/playlist/community', { params: { limit } }).then(unwrap);
  },
  getById: (id) => api.get(`/playlist/${id}`).then(unwrap),
  create: (data) => api.post('/playlist/create', data).then(unwrap),
  update: ({ id, data }) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.patch(`/playlist/${id}`, data, config).then(unwrap);
  },
  addSong: ({ playlistId, songId, songIds }) =>
    api.post(`/playlist/${playlistId}/add-song`, { songId, songIds }).then(unwrap),
  removeSong: ({ playlistId, songId }) =>
    api.patch(`/playlist/${playlistId}/remove-song`, { songId }).then(unwrap),
  delete: (id) => api.delete(`/playlist/${id}`).then((res) => res.data?.data || res.data || { id }),
};

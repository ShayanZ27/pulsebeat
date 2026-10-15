import api, { unwrap } from './api';

export const playlistService = {
  getUserPlaylists: () => api.get('/playlist').then(unwrap),
  getCommunity: (limit = 20) => api.get('/playlist/community', { params: { limit } }).then(unwrap),
  getById: (id) => api.get(`/playlist/${id}`).then(unwrap),
  create: (data) => api.post('/playlist/create', data).then(unwrap),
  addSong: ({ playlistId, songId, songIds }) =>
    api.post(`/playlist/${playlistId}/add-song`, { songId, songIds }).then(unwrap),
};

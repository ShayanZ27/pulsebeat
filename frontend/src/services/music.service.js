import api, { unwrap, unwrapWithPagination } from './api';

export const musicService = {
  getAll: (params) => api.get('/music', { params }).then(unwrap),
  getLatestReleases: (arg = 10) => {
    if (typeof arg === 'object' && arg !== null) {
      return api.get('/music/latest-releases', { params: arg }).then(unwrapWithPagination);
    }
    return api.get(`/music/latest-releases/${arg}`).then(unwrap);
  },
  getTrending: (arg = 20) => {
    if (typeof arg === 'object' && arg !== null) {
      return api.get('/music/trending-music', { params: arg }).then(unwrapWithPagination);
    }
    return api.get(`/music/trending-music/${arg}`).then(unwrap);
  },
  getTrendingAlbums: (arg = 10) => {
    if (typeof arg === 'object' && arg !== null) {
      return api.get('/music/trending-albums', { params: arg }).then(unwrapWithPagination);
    }
    return api.get(`/music/trending-albums/${arg}`).then(unwrap);
  },
  getTrendingArtists: (arg = 10) => {
    if (typeof arg === 'object' && arg !== null) {
      return api.get('/music/trending-artists', { params: arg }).then(unwrapWithPagination);
    }
    return api.get(`/music/trending-artists/${arg}`).then(unwrap);
  },
  getAlbum: (id) => api.get(`/music/albums/${id}`).then(unwrap),
  getArtistProfile: (id) => api.get(`/music/artist/${id}/profile`).then(unwrap),
  getArtistMusic: (id) => api.get(`/music/artist/${id}/music`).then(unwrap),
  getArtistAlbums: (id) => api.get(`/music/artist/${id}/albums`).then(unwrap),

  /** Hero showcase slides: [{ type: 'album' | 'track' | 'playlist', item }] */
  getFeatured: () => api.get('/featured').then(unwrap),

  /** Returns Music documents, unwrapped from the RecentlyPlayed records. */
  getRecentlyPlayed: () =>
    api
      .get('/music/recently-played')
      .then(unwrap)
      .then((records = []) => records.map((record) => record.history?.contentId).filter(Boolean)),

  /** Increments play counts and pushes the song onto the RecentlyPlayed deque. */
  recordPlay: (id) => api.post(`/music/play/${id}`).then(unwrap),

  /** Artist content management */
  uploadMusic: (formData) =>
    api.post('/music/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  createAlbum: (formData) =>
    api.post('/music/create-album', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  toggleMusicVisibility: (id) => api.patch(`/music/${id}/visibility`).then(unwrap),
  toggleAlbumVisibility: (id) => api.patch(`/music/albums/${id}/visibility`).then(unwrap),

  deleteMusic: (id) => api.delete(`/music/${id}`).then(unwrap),
  deleteAlbum: (id) => api.delete(`/music/albums/${id}`).then(unwrap),
};

import api, { unwrap } from './api';

export const musicService = {
  getAll: (params) => api.get('/music', { params }).then(unwrap),
  getLatestReleases: (limit = 10) => api.get(`/music/latest-releases/${limit}`).then(unwrap),
  getTrending: (limit = 20) => api.get(`/music/trending-music/${limit}`).then(unwrap),
  getTrendingAlbums: (limit = 10) => api.get(`/music/trending-albums/${limit}`).then(unwrap),
  getTrendingArtists: (limit = 10) => api.get(`/music/trending-artists/${limit}`).then(unwrap),
  getAlbum: (id) => api.get(`/music/albums/${id}`).then(unwrap),
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
};

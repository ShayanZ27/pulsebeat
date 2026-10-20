import api, { unwrap } from './api';

export const userService = {
  getProfile: () => api.get('/user/profile').then(unwrap),

  updateProfile: (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.put('/user/profile', data, config).then(unwrap);
  },

  requestArtist: ({ statement }) =>
    api.put('/user/request-artist', { statement }).then(unwrap),
};

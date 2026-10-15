import api, { unwrap } from './api';

export const activityService = {
  getFeed: (limit = 20) => api.get('/activity/feed', { params: { limit } }).then(unwrap),
};

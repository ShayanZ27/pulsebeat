import api, { unwrap } from './api';

export const searchService = {
  search: (query, type = 'all') => {
    return api
      .get('/search', { params: { q: query, type } })
      .then(unwrap);
  },
};

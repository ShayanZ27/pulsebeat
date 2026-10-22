import api, { unwrap } from './api';

export const adminService = {
  // Reports
  getReports: ({ status, type } = {}) =>
    api.get('/admin/reports', { params: { status, type } }).then(unwrap),

  resolveReport: ({ reportId, status, comments }) =>
    api.put(`/admin/resolve-report/${reportId}`, { status, comments }).then(unwrap),

  // Artist Requests
  getArtistRequests: ({ status } = {}) =>
    api.get('/admin/artist-requests', { params: { status } }).then(unwrap),

  approveArtist: (requestId) =>
    api.put(`/admin/approve-artist/${requestId}`).then(unwrap),

  rejectArtist: ({ requestId, reason }) =>
    api.put(`/admin/reject-artist/${requestId}`, { reason }).then(unwrap),

  // Suspension (User / Artist)
  suspendUser: (userId) =>
    api.patch(`/admin/suspend-user/${userId}`).then(unwrap),

  unsuspendUser: (userId) =>
    api.patch(`/admin/unsuspend-user/${userId}`).then(unwrap),

  // Content Suspension (Track / Album)
  hideContent: ({ contentId, type }) =>
    api.put(`/admin/hide-content/${contentId}?type=${type}`).then(unwrap),

  restoreContent: ({ contentId, type }) =>
    api.put(`/admin/restore-content/${contentId}?type=${type}`).then(unwrap),

  // Featured Content
  getFeaturedContent: () =>
    api.get('/admin/featured').then(unwrap),

  addFeaturedContent: ({ contentId, contentType }) =>
    api.post('/admin/featured', { contentId, contentType }).then(unwrap),

  removeFeaturedContent: ({ contentId, contentType }) =>
    api.delete(`/admin/featured/${contentId}?type=${contentType}`).then(unwrap),

  reorderFeaturedContent: (items) =>
    api.put('/admin/featured/reorder', { items }).then(unwrap),

  // Suspended Content
  getSuspendedContent: ({ type } = {}) =>
    api.get('/admin/suspended', { params: { type } }).then(unwrap),
};

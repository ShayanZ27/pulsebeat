import { createAction } from '@reduxjs/toolkit';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { getErrorMessage } from '../services/api';
import { activityService } from '../services/activity.service';
import { authService } from '../services/auth.service';
import { likeService } from '../services/like.service';
import { musicService } from '../services/music.service';
import { playlistService } from '../services/playlist.service';
import { searchService } from '../services/search.service';
import { userService } from '../services/user.service';
import { adminService } from '../services/admin.service';

/** Dispatched when an authenticated request comes back 401 (stale/expired cookie). */
export const sessionExpired = createAction('auth/sessionExpired');

/**
 * Adapts a `services/` handler into an RTK Query `queryFn`.
 * HTTP stays in services/; RTK Query only adds caching, dedupe and status.
 *
 * Auth endpoints opt out of the 401 handling: a 401 from /auth/login means
 * "wrong password", not "session expired".
 */
function fromService(handler, { signOutOn401 = true } = {}) {
  return async (arg, { dispatch }) => {
    try {
      return { data: await handler(arg) };
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 && signOutOn401) dispatch(sessionExpired());
      return { error: { status, message: getErrorMessage(error) } };
    }
  };
}

const noSessionHandling = { signOutOn401: false };

export const pulsebeatApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['RecentlyPlayed', 'UserPlaylists', 'LikedMusic', 'LikedAlbums', 'LikedPlaylists', 'Playlist', 'Album', 'ActivityFeed', 'UserProfile', 'ArtistProfile', 'ArtistMusic', 'ArtistAlbums', 'AdminReports', 'AdminArtistRequests', 'AdminFeatured', 'Featured', 'AdminSuspended'],
  endpoints: (build) => ({
    /* ── Auth ── */
    login: build.mutation({ queryFn: fromService(authService.login, noSessionHandling) }),
    register: build.mutation({ queryFn: fromService(authService.register, noSessionHandling) }),
    // Resolve to null: the raw Axios response isn't serialisable.
    logout: build.mutation({ queryFn: fromService(() => authService.logout().then(() => null), noSessionHandling) }),

    /* ── Homepage data (arg = optional limit; services supply defaults) ── */
    getLatestReleases: build.query({ queryFn: fromService(musicService.getLatestReleases) }),
    getTrendingMusic: build.query({ queryFn: fromService(musicService.getTrending) }),
    getTrendingAlbums: build.query({ queryFn: fromService(musicService.getTrendingAlbums) }),
    getTrendingArtists: build.query({ queryFn: fromService(musicService.getTrendingArtists) }),
    getFeatured: build.query({
      queryFn: fromService(musicService.getFeatured),
      providesTags: ['Featured'],
    }),
    getRecentlyPlayed: build.query({
      queryFn: fromService(musicService.getRecentlyPlayed),
      providesTags: ['RecentlyPlayed'],
    }),
    getUserPlaylists: build.query({
      queryFn: fromService(playlistService.getUserPlaylists),
      providesTags: ['UserPlaylists'],
    }),
    getPlaylistById: build.query({
      queryFn: fromService(playlistService.getById),
      providesTags: (result, error, id) => [{ type: 'Playlist', id }],
    }),
    createPlaylist: build.mutation({
      queryFn: fromService(playlistService.create),
      invalidatesTags: ['UserPlaylists'],
    }),
    addToPlaylist: build.mutation({
      queryFn: fromService(playlistService.addSong),
      invalidatesTags: (result, error, { playlistId }) => [{ type: 'Playlist', id: playlistId }, 'UserPlaylists', 'ActivityFeed'],
    }),
    removeSongFromPlaylist: build.mutation({
      queryFn: fromService(playlistService.removeSong),
      invalidatesTags: (result, error, { playlistId }) => [{ type: 'Playlist', id: playlistId }, 'UserPlaylists', 'ActivityFeed'],
    }),
    deletePlaylist: build.mutation({
      queryFn: fromService(playlistService.delete),
      invalidatesTags: (result, error, id) => [{ type: 'Playlist', id }, 'UserPlaylists', 'ActivityFeed'],
    }),
    updatePlaylist: build.mutation({
      queryFn: fromService(playlistService.update),
      invalidatesTags: (result, error, { id }) => [{ type: 'Playlist', id }, 'UserPlaylists'],
    }),
    getCommunityPlaylists: build.query({ queryFn: fromService(playlistService.getCommunity) }),
    getActivityFeed: build.query({
      queryFn: fromService(activityService.getFeed),
      providesTags: ['ActivityFeed'],
    }),

    /* ── Catalog, Albums, Artists ── */
    getAlbumById: build.query({
      queryFn: fromService(musicService.getAlbum),
      providesTags: (result, error, id) => [{ type: 'Album', id }],
    }),
    getArtistProfile: build.query({
      queryFn: fromService(musicService.getArtistProfile),
      providesTags: (result, error, id) => [{ type: 'ArtistProfile', id }],
    }),
    getArtistMusic: build.query({
      queryFn: fromService(musicService.getArtistMusic),
      providesTags: ['ArtistMusic'],
    }),
    getArtistAlbums: build.query({
      queryFn: fromService(musicService.getArtistAlbums),
      providesTags: ['ArtistAlbums'],
    }),
    getAllMusic: build.query({ queryFn: fromService(musicService.getAll) }),

    /* ── Artist Content Management ── */
    uploadMusic: build.mutation({
      queryFn: fromService(musicService.uploadMusic),
      invalidatesTags: ['ArtistMusic', 'ActivityFeed'],
    }),
    createAlbum: build.mutation({
      queryFn: fromService(musicService.createAlbum),
      invalidatesTags: ['ArtistAlbums', 'ActivityFeed'],
    }),
    toggleMusicVisibility: build.mutation({
      queryFn: fromService(musicService.toggleMusicVisibility),
      invalidatesTags: ['ArtistMusic'],
    }),
    toggleAlbumVisibility: build.mutation({
      queryFn: fromService(musicService.toggleAlbumVisibility),
      invalidatesTags: ['ArtistAlbums'],
    }),
    deleteMusic: build.mutation({
      queryFn: fromService(musicService.deleteMusic),
      invalidatesTags: ['ArtistMusic', 'ArtistAlbums'],
    }),
    deleteAlbum: build.mutation({
      queryFn: fromService(musicService.deleteAlbum),
      invalidatesTags: ['ArtistAlbums'],
    }),

    /* ── Likes ── */
    getLikedMusic: build.query({
      queryFn: fromService(likeService.getLikedMusic),
      providesTags: ['LikedMusic'],
    }),
    getLikedAlbums: build.query({
      queryFn: fromService(likeService.getLikedAlbums),
      providesTags: ['LikedAlbums'],
    }),
    getLikedPlaylists: build.query({
      queryFn: fromService(likeService.getLikedPlaylists),
      providesTags: ['LikedPlaylists'],
    }),
    addLike: build.mutation({
      queryFn: fromService(likeService.addLike),
      invalidatesTags: (result, error, arg) => {
        const id = arg?.id || arg?.targetId;
        const targetType = arg?.targetType;
        const tags = ['LikedMusic', 'LikedAlbums', 'LikedPlaylists', 'ActivityFeed'];
        if (targetType === 'playlist' && id) tags.push({ type: 'Playlist', id });
        if (targetType === 'album' && id) tags.push({ type: 'Album', id });
        return tags;
      },
    }),
    removeLike: build.mutation({
      queryFn: fromService(likeService.removeLike),
      invalidatesTags: (result, error, arg) => {
        const id = arg?.id || arg?.targetId;
        const targetType = arg?.targetType;
        const tags = ['LikedMusic', 'LikedAlbums', 'LikedPlaylists', 'ActivityFeed'];
        if (targetType === 'playlist' && id) tags.push({ type: 'Playlist', id });
        if (targetType === 'album' && id) tags.push({ type: 'Album', id });
        return tags;
      },
    }),

    /* ── Search ── */
    search: build.query({
      queryFn: fromService((arg) => {
        const query = typeof arg === 'string' ? arg : arg?.query;
        const type = typeof arg === 'object' && arg?.type ? arg.type : 'all';
        return searchService.search(query, type);
      }),
    }),

    /* ── Playback ── */
    recordPlay: build.mutation({
      queryFn: fromService(musicService.recordPlay),
      invalidatesTags: ['RecentlyPlayed'],
    }),
    /* ── User Profile & Artist Requests ── */
    getUserProfile: build.query({
      queryFn: fromService(userService.getProfile),
      providesTags: ['UserProfile'],
    }),
    updateUserProfile: build.mutation({
      queryFn: fromService(userService.updateProfile),
      invalidatesTags: ['UserProfile'],
    }),
    requestArtistRole: build.mutation({
      queryFn: fromService(userService.requestArtist),
      invalidatesTags: ['UserProfile'],
    }),
    reportContent: build.mutation({
      queryFn: fromService(userService.reportContent),
      invalidatesTags: ['AdminReports'],
    }),

    /* ── Admin Endpoints ── */
    getAdminReports: build.query({
      queryFn: fromService(adminService.getReports),
      providesTags: ['AdminReports'],
    }),
    resolveAdminReport: build.mutation({
      queryFn: fromService(adminService.resolveReport),
      invalidatesTags: ['AdminReports'],
    }),

    getAdminArtistRequests: build.query({
      queryFn: fromService(adminService.getArtistRequests),
      providesTags: ['AdminArtistRequests'],
    }),
    approveArtistRequest: build.mutation({
      queryFn: fromService(adminService.approveArtist),
      invalidatesTags: ['AdminArtistRequests', 'UserProfile'],
    }),
    rejectArtistRequest: build.mutation({
      queryFn: fromService(adminService.rejectArtist),
      invalidatesTags: ['AdminArtistRequests'],
    }),

    adminSuspendUser: build.mutation({
      queryFn: fromService(adminService.suspendUser),
      invalidatesTags: ['AdminReports', 'UserProfile', 'AdminSuspended', 'ArtistProfile', 'ArtistMusic', 'ArtistAlbums'],
    }),
    adminUnsuspendUser: build.mutation({
      queryFn: fromService(adminService.unsuspendUser),
      invalidatesTags: ['AdminReports', 'UserProfile', 'AdminSuspended', 'ArtistProfile', 'ArtistMusic', 'ArtistAlbums'],
    }),

    adminHideContent: build.mutation({
      queryFn: fromService(adminService.hideContent),
      invalidatesTags: ['AdminReports', 'Album', 'Playlist', 'ArtistMusic', 'ArtistAlbums', 'AdminSuspended'],
    }),
    adminRestoreContent: build.mutation({
      queryFn: fromService(adminService.restoreContent),
      invalidatesTags: ['AdminReports', 'Album', 'Playlist', 'ArtistMusic', 'ArtistAlbums', 'AdminSuspended'],
    }),

    getAdminFeatured: build.query({
      queryFn: fromService(adminService.getFeaturedContent),
      providesTags: ['AdminFeatured'],
    }),
    addAdminFeatured: build.mutation({
      queryFn: fromService(adminService.addFeaturedContent),
      invalidatesTags: ['AdminFeatured', 'Featured'],
    }),
    removeAdminFeatured: build.mutation({
      queryFn: fromService(adminService.removeFeaturedContent),
      invalidatesTags: ['AdminFeatured', 'Featured'],
    }),
    reorderAdminFeatured: build.mutation({
      queryFn: fromService(adminService.reorderFeaturedContent),
      invalidatesTags: ['AdminFeatured', 'Featured'],
    }),

    getAdminSuspended: build.query({
      queryFn: fromService(adminService.getSuspendedContent),
      providesTags: ['AdminSuspended'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetLatestReleasesQuery,
  useGetTrendingMusicQuery,
  useGetTrendingAlbumsQuery,
  useGetTrendingArtistsQuery,
  useGetFeaturedQuery,
  useGetRecentlyPlayedQuery,
  useGetUserPlaylistsQuery,
  useGetPlaylistByIdQuery,
  useCreatePlaylistMutation,
  useAddToPlaylistMutation,
  useRemoveSongFromPlaylistMutation,
  useDeletePlaylistMutation,
  useUpdatePlaylistMutation,
  useGetCommunityPlaylistsQuery,
  useGetActivityFeedQuery,
  useGetAlbumByIdQuery,
  useGetArtistProfileQuery,
  useGetArtistMusicQuery,
  useGetArtistAlbumsQuery,
  useGetAllMusicQuery,
  useUploadMusicMutation,
  useCreateAlbumMutation,
  useToggleMusicVisibilityMutation,
  useToggleAlbumVisibilityMutation,
  useDeleteMusicMutation,
  useDeleteAlbumMutation,
  useGetLikedMusicQuery,
  useGetLikedAlbumsQuery,
  useGetLikedPlaylistsQuery,
  useAddLikeMutation,
  useRemoveLikeMutation,
  useRecordPlayMutation,
  useSearchQuery,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useRequestArtistRoleMutation,
  useReportContentMutation,
  useGetAdminReportsQuery,
  useResolveAdminReportMutation,
  useGetAdminArtistRequestsQuery,
  useApproveArtistRequestMutation,
  useRejectArtistRequestMutation,
  useAdminSuspendUserMutation,
  useAdminUnsuspendUserMutation,
  useAdminHideContentMutation,
  useAdminRestoreContentMutation,
  useGetAdminFeaturedQuery,
  useAddAdminFeaturedMutation,
  useRemoveAdminFeaturedMutation,
  useReorderAdminFeaturedMutation,
  useGetAdminSuspendedQuery,
} = pulsebeatApi;

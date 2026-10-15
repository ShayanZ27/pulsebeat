import { createAction } from '@reduxjs/toolkit';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { getErrorMessage } from '../services/api';
import { activityService } from '../services/activity.service';
import { authService } from '../services/auth.service';
import { likeService } from '../services/like.service';
import { musicService } from '../services/music.service';
import { playlistService } from '../services/playlist.service';

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
  tagTypes: ['RecentlyPlayed', 'UserPlaylists', 'LikedMusic'],
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
    getRecentlyPlayed: build.query({
      queryFn: fromService(musicService.getRecentlyPlayed),
      providesTags: ['RecentlyPlayed'],
    }),
    getUserPlaylists: build.query({
      queryFn: fromService(playlistService.getUserPlaylists),
      providesTags: ['UserPlaylists'],
    }),
    createPlaylist: build.mutation({
      queryFn: fromService(playlistService.create),
      invalidatesTags: ['UserPlaylists'],
    }),
    addToPlaylist: build.mutation({
      queryFn: fromService(playlistService.addSong),
      invalidatesTags: ['UserPlaylists'],
    }),
    getCommunityPlaylists: build.query({ queryFn: fromService(playlistService.getCommunity) }),
    getActivityFeed: build.query({ queryFn: fromService(activityService.getFeed) }),

    /* ── Likes ── */
    getLikedMusic: build.query({
      queryFn: fromService(likeService.getLikedMusic),
      providesTags: ['LikedMusic'],
    }),
    getLikedAlbums: build.query({
      queryFn: fromService(likeService.getLikedAlbums),
      providesTags: ['LikedAlbums'],
    }),
    addLike: build.mutation({
      queryFn: fromService(likeService.addLike),
      invalidatesTags: ['LikedMusic', 'LikedAlbums'],
    }),
    removeLike: build.mutation({
      queryFn: fromService(likeService.removeLike),
      invalidatesTags: ['LikedMusic', 'LikedAlbums'],
    }),

    /* ── Playback ── */
    recordPlay: build.mutation({
      queryFn: fromService(musicService.recordPlay),
      invalidatesTags: ['RecentlyPlayed'],
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
  useGetRecentlyPlayedQuery,
  useGetUserPlaylistsQuery,
  useCreatePlaylistMutation,
  useAddToPlaylistMutation,
  useGetCommunityPlaylistsQuery,
  useGetActivityFeedQuery,
  useGetLikedMusicQuery,
  useGetLikedAlbumsQuery,
  useAddLikeMutation,
  useRemoveLikeMutation,
  useRecordPlayMutation,
} = pulsebeatApi;

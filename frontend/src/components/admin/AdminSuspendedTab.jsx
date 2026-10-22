import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShieldAlert,
  Music2,
  Disc,
  Users,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Eye,
  Headphones,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  useGetAdminSuspendedQuery,
  useAdminRestoreContentMutation,
  useAdminUnsuspendUserMutation,
  useRecordPlayMutation,
} from '../../store/api';
import { playTracks, selectCurrentTrack, selectIsPlaying } from '../../store/playerSlice';
import { getDisplayName, formatTime } from '../../utils/format';
import { showToast } from '../../utils/toast';
import { PlayingHeartbeat } from '../common/PulseAnimations';

export default function AdminSuspendedTab({ accentColor, accentTextColor }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const [activeSubTab, setActiveSubTab] = useState('tracks'); // 'tracks' | 'albums' | 'artists'

  const { data: suspendedData = { tracks: [], albums: [], artists: [] }, isLoading, refetch } = useGetAdminSuspendedQuery();

  const [restoreContent, { isLoading: restoringContent }] = useAdminRestoreContentMutation();
  const [unsuspendUser, { isLoading: unsuspendingUser }] = useAdminUnsuspendUserMutation();
  const [recordPlay] = useRecordPlayMutation();

  const tracks = suspendedData.tracks || [];
  const albums = suspendedData.albums || [];
  const artists = suspendedData.artists || [];

  const handlePlayTrack = (track) => {
    if (!track) return;
    dispatch(
      playTracks({
        tracks: [track],
        startIndex: 0,
      })
    );
    if (track._id) {
      recordPlay(track._id).catch(() => {});
    }
  };

  const handleRestoreTrack = async (track) => {
    try {
      await restoreContent({ contentId: track._id, type: 'music' }).unwrap();
      showToast.success(`"${track.title}" has been restored to the public catalogue`);
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || err?.message || 'Failed to restore track');
    }
  };

  const handleRestoreAlbum = async (album) => {
    try {
      await restoreContent({ contentId: album._id, type: 'album' }).unwrap();
      showToast.success(`"${album.title}" has been restored to the public catalogue`);
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || err?.message || 'Failed to restore album');
    }
  };

  const handleUnsuspendArtist = async (artist) => {
    try {
      await unsuspendUser(artist._id).unwrap();
      showToast.success(`Artist account for "${getDisplayName(artist, 'Artist')}" has been unsuspended`);
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || err?.message || 'Failed to unsuspend artist');
    }
  };

  const totalSuspended = tracks.length + albums.length + artists.length;

  return (
    <div className="space-y-6">
      {/* Tab Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-sidebar border border-brd shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-space font-bold uppercase tracking-wider text-red-400">
            <ShieldAlert size={15} />
            <span>Moderation Vault</span>
          </div>
          <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">
            Suspended Items
          </h2>
          <p className="text-xs md:text-sm text-txt-sec">
            Withheld tracks, albums, and creator accounts removed from public discovery. You can inspect details and restore them anytime.
          </p>
        </div>

        {/* Sub-Tabs: Tracks vs Albums vs Artists */}
        <div className="flex items-center gap-1.5 p-1 bg-elevated rounded-2xl border border-brd shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('tracks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'tracks' ? 'shadow-sm' : 'text-txt-sec hover:text-txt'
            }`}
            style={activeSubTab === 'tracks' ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
          >
            <Music2 size={14} />
            <span>Tracks</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubTab === 'tracks'
                  ? 'bg-black/20 text-current'
                  : tracks.length > 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-sidebar text-txt-muted'
              }`}
            >
              {tracks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('albums')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'albums' ? 'shadow-sm' : 'text-txt-sec hover:text-txt'
            }`}
            style={activeSubTab === 'albums' ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
          >
            <Disc size={14} />
            <span>Albums</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubTab === 'albums'
                  ? 'bg-black/20 text-current'
                  : albums.length > 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-sidebar text-txt-muted'
              }`}
            >
              {albums.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('artists')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'artists' ? 'shadow-sm' : 'text-txt-sec hover:text-txt'
            }`}
            style={activeSubTab === 'artists' ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
          >
            <Users size={14} />
            <span>Artists</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubTab === 'artists'
                  ? 'bg-black/20 text-current'
                  : artists.length > 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-sidebar text-txt-muted'
              }`}
            >
              {artists.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-sidebar border border-brd/50 animate-pulse" />
          ))}
        </div>
      ) : activeSubTab === 'tracks' ? (
        /* ══════════════════════════════════════════════════════
           SUB-TAB: SUSPENDED TRACKS
        ══════════════════════════════════════════════════════ */
        tracks.length === 0 ? (
          <div className="py-20 text-center p-8 rounded-3xl bg-sidebar border border-brd">
            <div className="w-16 h-16 rounded-3xl bg-elevated flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-brd">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-txt mb-1">No Suspended Tracks</h3>
            <p className="text-xs text-txt-sec max-w-md mx-auto">
              All music tracks in the platform are active and publicly accessible. Tracks suspended via moderation will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-sidebar rounded-3xl border border-brd overflow-hidden shadow-sm">
            <div className="p-4 md:px-6 border-b border-brd grid grid-cols-12 text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6 md:col-span-5">Track & Artist</span>
              <span className="col-span-2 hidden md:block text-right">Plays</span>
              <span className="col-span-2 hidden md:block text-right">Duration</span>
              <span className="col-span-5 md:col-span-2 text-right pr-2">Action</span>
            </div>

            <div className="divide-y divide-brd/50">
              {tracks.map((track, idx) => {
                const isThisPlaying = currentTrack?._id === track._id && isPlaying;
                const artistName = getDisplayName(track.artist, 'Unknown Artist');

                return (
                  <div
                    key={track._id}
                    className="p-4 md:px-6 grid grid-cols-12 items-center gap-2 hover:bg-elevated/40 transition-colors group"
                  >
                    {/* Index & Play Button */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handlePlayTrack(track)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-txt-muted hover:text-txt hover:bg-elevated transition-colors cursor-pointer"
                        title={isThisPlaying ? 'Playing preview' : 'Play preview'}
                      >
                        {isThisPlaying ? (
                          <PlayingHeartbeat size={14} color={accentColor} />
                        ) : (
                          <Play size={14} className="ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Artwork + Title + Artist */}
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-card border border-brd shrink-0 relative">
                        {track.coverImage ? (
                          <img
                            src={track.coverImage}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-elevated text-txt-muted">
                            <Music2 size={18} />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-sm" title="Suspended" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-txt truncate font-space">
                          {track.title}
                        </p>
                        <p className="text-xs text-txt-sec truncate">
                          {artistName}
                        </p>
                      </div>
                    </div>

                    {/* Plays Count */}
                    <div className="col-span-2 hidden md:block text-right text-xs font-mono text-txt-sec">
                      {(track.plays || 0).toLocaleString()}
                    </div>

                    {/* Duration */}
                    <div className="col-span-2 hidden md:block text-right text-xs font-mono text-txt-sec">
                      {formatTime(track.duration || 0)}
                    </div>

                    {/* Restore Action */}
                    <div className="col-span-5 md:col-span-2 flex items-center justify-end pr-2">
                      <button
                        type="button"
                        disabled={restoringContent}
                        onClick={() => handleRestoreTrack(track)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-space font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        title="Restore track to public catalogue"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : activeSubTab === 'albums' ? (
        /* ══════════════════════════════════════════════════════
           SUB-TAB: SUSPENDED ALBUMS
        ══════════════════════════════════════════════════════ */
        albums.length === 0 ? (
          <div className="py-20 text-center p-8 rounded-3xl bg-sidebar border border-brd">
            <div className="w-16 h-16 rounded-3xl bg-elevated flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-brd">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-txt mb-1">No Suspended Albums</h3>
            <p className="text-xs text-txt-sec max-w-md mx-auto">
              All albums and discography releases are active. Suspended albums will be archived here for review and restoration.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {albums.map((album) => {
              const artistName = getDisplayName(album.artist, 'Unknown Artist');
              const songCount = Array.isArray(album.songs) ? album.songs.length : 0;

              return (
                <div
                  key={album._id}
                  className="p-5 rounded-3xl bg-sidebar border border-brd shadow-sm flex items-center justify-between gap-4 hover:border-brd/80 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-card border border-brd shrink-0 relative">
                      {album.coverImage ? (
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-elevated text-txt-muted">
                          <Disc size={24} />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" title="Suspended" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-txt truncate font-space">
                          {album.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-space uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                          Suspended
                        </span>
                      </div>
                      <p className="text-xs text-txt-sec truncate">
                        By {artistName}
                      </p>
                      <p className="text-[11px] text-txt-muted font-mono">
                        {songCount} {songCount === 1 ? 'track' : 'tracks'} • {(album.plays || 0).toLocaleString()} plays
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={restoringContent}
                      onClick={() => handleRestoreAlbum(album)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-space font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <RotateCcw size={13} />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ══════════════════════════════════════════════════════
           SUB-TAB: SUSPENDED ARTISTS
        ══════════════════════════════════════════════════════ */
        artists.length === 0 ? (
          <div className="py-20 text-center p-8 rounded-3xl bg-sidebar border border-brd">
            <div className="w-16 h-16 rounded-3xl bg-elevated flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-brd">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-txt mb-1">No Suspended Artists</h3>
            <p className="text-xs text-txt-sec max-w-md mx-auto">
              All creator and artist accounts are in good standing. Artists suspended via the moderation controls will be cataloged here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => {
              const displayName = getDisplayName(artist, artist.username || 'Artist');

              return (
                <div
                  key={artist._id}
                  className="p-5 rounded-3xl bg-sidebar border border-brd shadow-sm space-y-4 hover:border-brd/80 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-card border border-brd shrink-0 relative">
                      {artist.profilePicture ? (
                        <img
                          src={artist.profilePicture}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-elevated text-txt font-bold font-space text-lg">
                          {(artist.firstName?.[0] || artist.username?.[0] || 'A').toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" title="Suspended" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-txt truncate font-space">
                          {displayName}
                        </p>
                      </div>
                      <p className="text-xs text-txt-sec truncate font-mono">
                        @{artist.username}
                      </p>
                      <p className="text-[11px] text-txt-muted truncate">
                        {artist.email}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brd/50 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-space uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                      Suspended Account
                    </span>

                    <button
                      type="button"
                      disabled={unsuspendingUser}
                      onClick={() => handleUnsuspendArtist(artist)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-space font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <RotateCcw size={13} />
                      <span>Unsuspend</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  Clock,
  Music2,
  Trash2,
  Share2,
  Lock,
  Globe,
  ArrowLeft,
  Pencil,
} from 'lucide-react';
import {
  useGetPlaylistByIdQuery,
  useRemoveSongFromPlaylistMutation,
  useDeletePlaylistMutation,
  useRecordPlayMutation,
  useGetLikedMusicQuery,
  useGetLikedPlaylistsQuery,
  useAddLikeMutation,
  useRemoveLikeMutation,
} from '../store/api';
import { playTracks, togglePlay, selectIsPlaying, selectCurrentTrack } from '../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';
import { selectCurrentUser } from '../store/authSlice';
import TrackActionMenu from '../components/common/TrackActionMenu';
import EditPlaylistModal from '../components/common/EditPlaylistModal';
import { HeartbeatLoader, PlayingHeartbeat, PlayingOverlay } from '../components/common/PulseAnimations';
import { formatTime } from '../utils/format';
import { showToast } from '../utils/toast';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const user = useSelector(selectCurrentUser);
  const isPlaying = useSelector(selectIsPlaying);
  const currentTrack = useSelector(selectCurrentTrack);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: playlist, isLoading, error } = useGetPlaylistByIdQuery(id);
  const [removeSongMutation] = useRemoveSongFromPlaylistMutation();
  const [deletePlaylistMutation, { isLoading: isDeleting }] = useDeletePlaylistMutation();
  const [recordPlay] = useRecordPlayMutation();
  const { data: likedMusic = [] } = useGetLikedMusicQuery();
  const { data: rawLikedPlaylists = [] } = useGetLikedPlaylistsQuery();
  const [addLike] = useAddLikeMutation();
  const [removeLike] = useRemoveLikeMutation();

  const isPlaylistLiked = rawLikedPlaylists.some(l => {
    const plId = l.targetId?._id || l.targetId?.id || l.targetId || l._id;
    return String(plId) === String(id);
  });

  const isOwner = playlist && user && String(playlist.owner?._id || playlist.owner) === String(user._id);
  const songs = playlist?.songs || [];
  const isCurrentlyPlayingThisPlaylist = songs.some(s => s._id === currentTrack?._id) && isPlaying;

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const handlePlayAll = (shuffle = false) => {
    if (!songs.length) return;
    let list = [...songs];
    if (shuffle) {
      list.sort(() => Math.random() - 0.5);
    }
    dispatch(playTracks(list, 0));
    const first = list[0];
    if (first?._id && !String(first._id).startsWith('sample-')) {
      recordPlay(first._id).catch(() => {});
    }
  };

  const handlePlaySingle = (song, index) => {
    dispatch(playTracks(songs, index));
    if (song?._id && !String(song._id).startsWith('sample-')) {
      recordPlay(song._id).catch(() => {});
    }
  };

  const handleRemoveTrack = async (e, songId, title) => {
    if (e) e.stopPropagation();
    try {
      await removeSongMutation({ playlistId: id, songId }).unwrap();
      showToast(`Removed "${title}" from playlist`, 'info');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to remove song', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePlaylistMutation(id).unwrap();
      showToast(`Deleted playlist "${playlist?.name}"`, 'info');
      setShowDeleteModal(false);
      navigate('/library');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to delete playlist', 'error');
    }
  };

  const handleToggleLikeTrack = async (e, track) => {
    e.stopPropagation();
    const trackId = track._id;
    const isLiked = likedMusic.some(m => {
      const mId = m.targetId?._id || m.targetId || m._id;
      return String(mId) === String(trackId);
    });
    try {
      if (isLiked) {
        await removeLike({ id: trackId, targetType: 'music' }).unwrap();
        showToast(`Removed "${track.title}" from Liked Songs`, 'info');
      } else {
        await addLike({ id: trackId, targetType: 'music' }).unwrap();
        showToast(`Saved "${track.title}" to Liked Songs`, 'success');
      }
    } catch (err) {
      showToast(err?.data?.message || 'Action failed', 'error');
    }
  };

  const handleTogglePlaylistLike = async () => {
    try {
      if (isPlaylistLiked) {
        await removeLike({ id, targetType: 'playlist' }).unwrap();
        showToast(`Removed "${playlist?.name || 'playlist'}" from library`, 'info');
      } else {
        await addLike({ id, targetType: 'playlist' }).unwrap();
        showToast(`Saved "${playlist?.name || 'playlist'}" to library`, 'success');
      }
    } catch (err) {
      showToast(err?.data?.message || 'Action failed', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 rounded-3xl bg-sidebar border border-brd" />
        <div className="h-96 rounded-2xl bg-sidebar border border-brd" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="text-center py-20 bg-sidebar rounded-3xl border border-brd p-8 max-w-lg mx-auto mt-12 space-y-4">
        <Music2 size={48} className="mx-auto text-txt-muted opacity-40" />
        <h2 className="text-2xl font-playfair font-bold text-txt">Playlist not found</h2>
        <p className="text-sm text-txt-sec">This playlist may be private or has been removed.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-full text-sm font-space font-bold transition-all shadow-md"
          style={{ backgroundColor: accentColor, color: accentTextColor }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── Back Button ─── */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-space font-bold uppercase tracking-wider text-txt-muted hover:text-txt transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* ─── Header Hero ─── */}
      <div className="relative rounded-3xl overflow-hidden p-6 md:p-8 border border-brd bg-gradient-to-b from-sidebar via-elevated to-sidebar shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ backgroundColor: accentColor }} />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
          {/* Cover Art */}
          <div
            onClick={() => isOwner && setShowEditModal(true)}
            className={`relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-brd bg-elevated flex items-center justify-center group ${
              isOwner ? 'cursor-pointer' : ''
            }`}
            title={isOwner ? 'Click to edit playlist details' : undefined}
          >
            {playlist.coverImage ? (
              <img
                src={playlist.coverImage}
                alt={playlist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sidebar to-elevated">
                <Music2 size={64} style={{ color: accentColor }} />
              </div>
            )}

            {/* Edit details hover overlay for owner */}
            {isOwner && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 backdrop-blur-xs">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <Pencil size={18} />
                </div>
                <span className="text-xs font-space font-bold">Edit Details</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-space font-bold tracking-wider uppercase bg-sidebar border border-brd">
              {playlist.isPublic ? (
                <span className="flex items-center gap-1 text-emerald-500"><Globe size={12} /> Public Playlist</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500"><Lock size={12} /> Private Playlist</span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-playfair font-black text-txt tracking-tight leading-tight">
              {playlist.name}
            </h1>

            {playlist.description && (
              <p className="text-sm text-txt-sec max-w-xl">{playlist.description}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-txt-sec font-space">
              <span className="font-bold text-txt">
                {playlist.owner?.firstName
                  ? `${playlist.owner.firstName} ${playlist.owner.lastName || ''}`.trim()
                  : playlist.owner?.username || 'PulseBeat User'}
              </span>
              <span>•</span>
              <span>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
              <span>•</span>
              <span>{totalMinutes} min</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold text-txt">
                <Heart size={12} className={isPlaylistLiked ? 'fill-current text-red-500' : 'text-txt-sec'} />
                {playlist.likesCount || 0} {(playlist.likesCount || 0) === 1 ? 'like' : 'likes'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-brd/50">
          <button
            onClick={() => {
              if (isCurrentlyPlayingThisPlaylist) dispatch(togglePlay());
              else handlePlayAll(false);
            }}
            disabled={songs.length === 0}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            style={{ backgroundColor: accentColor, color: accentTextColor }}
            title={isCurrentlyPlayingThisPlaylist ? 'Pause' : 'Play playlist'}
          >
            {isCurrentlyPlayingThisPlaylist ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handlePlayAll(true)}
            disabled={songs.length === 0}
            className="w-11 h-11 rounded-full bg-sidebar border border-brd flex items-center justify-center text-txt-sec hover:text-txt hover:bg-elevated transition-colors disabled:opacity-50 cursor-pointer"
            title="Shuffle play"
          >
            <Shuffle size={20} />
          </button>

          {/* Like Playlist Button */}
          <button
            onClick={handleTogglePlaylistLike}
            className={`w-11 h-11 rounded-full bg-sidebar border border-brd flex items-center justify-center transition-colors cursor-pointer ${
              isPlaylistLiked ? 'text-red-500 hover:bg-elevated' : 'text-txt-sec hover:text-txt hover:bg-elevated'
            }`}
            title={isPlaylistLiked ? 'Remove from library' : 'Save playlist to library'}
            aria-label={isPlaylistLiked ? 'Remove from library' : 'Save playlist to library'}
          >
            <Heart size={20} className={isPlaylistLiked ? 'fill-current' : ''} />
          </button>

          {isOwner && (
            <button
              onClick={() => setShowEditModal(true)}
              className="w-11 h-11 rounded-full bg-sidebar border border-brd flex items-center justify-center text-txt-sec hover:text-primary hover:bg-elevated transition-colors cursor-pointer"
              title="Edit playlist details"
              aria-label="Edit playlist details"
            >
              <Pencil size={18} />
            </button>
          )}

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showToast('Playlist link copied to clipboard', 'info');
            }}
            className="w-11 h-11 rounded-full bg-sidebar border border-brd flex items-center justify-center text-txt-sec hover:text-txt hover:bg-elevated transition-colors cursor-pointer"
            title="Share playlist"
            aria-label="Share playlist"
          >
            <Share2 size={18} />
          </button>

          {isOwner && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-11 h-11 rounded-full bg-sidebar border border-brd flex items-center justify-center text-txt-sec hover:text-red-500 hover:bg-elevated transition-colors cursor-pointer"
              title="Delete playlist"
              aria-label="Delete playlist"
            >
              <Trash2 size={18} />
            </button>
          )}

          <TrackActionMenu
            itemType="playlist"
            item={playlist}
          />
        </div>
      </div>

      {/* ─── Tracklist Table ─── */}
      <div className="bg-sidebar rounded-3xl border border-brd overflow-hidden shadow-sm">
        {songs.length === 0 ? (
          <div className="text-center py-16 px-6 space-y-3">
            <Music2 size={40} className="mx-auto text-txt-muted opacity-40" />
            <h3 className="text-lg font-playfair font-bold text-txt">This playlist is empty</h3>
            <p className="text-sm text-txt-sec max-w-sm mx-auto">
              Add songs from the Home page or Discover section using the 3-dot menu.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-3 px-5 py-2 rounded-full text-xs font-space font-bold bg-elevated hover:bg-bg border border-brd transition-all"
            >
              Browse Music
            </button>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-4 px-6 border-b border-brd text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6 md:col-span-6">Title</span>
              <span className="hidden md:block col-span-3">Artist</span>
              <span className="col-span-5 md:col-span-2 text-right pr-2">Duration</span>
            </div>

            {/* Song Rows */}
            <div className="divide-y divide-brd/40">
              {songs.map((song, idx) => {
                const isThisPlaying = currentTrack?._id === song._id && isPlaying;
                const isLiked = likedMusic.some(m => {
                  const mId = m.targetId?._id || m.targetId || m._id;
                  return String(mId) === String(song._id);
                });

                return (
                  <div
                    key={song._id || idx}
                    onClick={() => handlePlaySingle(song, idx)}
                    className={`grid grid-cols-12 gap-2 items-center p-3.5 px-6 hover:bg-elevated transition-colors cursor-pointer group select-none ${
                      currentTrack?._id === song._id ? 'bg-elevated/70' : ''
                    }`}
                  >
                    {/* Index / Play indicator */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="group-hover:hidden text-xs font-space font-bold text-txt-muted flex items-center justify-center">
                        {isThisPlaying ? (
                          <PlayingHeartbeat size={15} color={accentColor} />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <Play size={16} className="hidden group-hover:block fill-current" style={{ color: accentColor }} />
                    </div>

                    {/* Title + Cover */}
                    <div className="col-span-6 md:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm bg-elevated">
                        <img
                          src={song.coverImage || 'https://picsum.photos/seed/track/80/80'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {isThisPlaying && (
                          <PlayingOverlay size={18} rounded="rounded-xl" color={accentColor} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-bold truncate group-hover:text-primary transition-colors"
                          style={currentTrack?._id === song._id ? { color: accentColor } : undefined}
                        >
                          {song.title}
                        </p>
                        <p className="text-xs text-txt-sec truncate md:hidden">
                          {song.artist?.firstName
                            ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                            : song.artist?.username || 'Artist'}
                        </p>
                      </div>
                    </div>

                    {/* Artist Column (Desktop) */}
                    <div className="hidden md:block col-span-3 text-xs text-txt-sec truncate">
                      {song.artist?.firstName
                        ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                        : song.artist?.username || 'Unknown Artist'}
                    </div>

                    {/* Duration + Actions */}
                    <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-2 pr-2">
                      <button
                        onClick={(e) => handleToggleLikeTrack(e, song)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isLiked ? 'text-red-500' : 'text-txt-muted hover:text-txt opacity-0 group-hover:opacity-100'
                        }`}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                      </button>

                      <span className="text-xs font-space text-txt-muted">
                        {formatTime(song.duration)}
                      </span>

                      <TrackActionMenu
                        item={song}
                        itemType="track"
                        onRemove={isOwner ? () => handleRemoveTrack(null, song._id, song.title) : undefined}
                        removeLabel="Remove from playlist"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Edit Playlist Modal ─── */}
      {showEditModal && (
        <EditPlaylistModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          playlist={playlist}
        />
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-sidebar border border-brd rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-playfair font-black text-txt">
                  Delete Playlist?
                </h3>
                <p className="text-xs text-txt-sec mt-0.5 font-space">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-sm text-txt-sec leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-txt">"{playlist.name}"</span> from your library?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-full text-xs font-space font-bold text-txt-sec hover:text-txt hover:bg-elevated border border-transparent hover:border-brd transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-6 py-2.5 rounded-full text-xs font-space font-bold bg-red-600 hover:bg-red-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <HeartbeatLoader size={16} color="#ffffff" /> Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

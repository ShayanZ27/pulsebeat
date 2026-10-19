import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  Disc,
  Share2,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import {
  useGetAlbumByIdQuery,
  useRecordPlayMutation,
  useGetLikedMusicQuery,
  useGetLikedAlbumsQuery,
  useAddLikeMutation,
  useRemoveLikeMutation,
} from '../store/api';
import { playTracks, togglePlay, selectIsPlaying, selectCurrentTrack } from '../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';
import TrackActionMenu from '../components/common/TrackActionMenu';
import AddToPlaylistModal from '../components/common/AddToPlaylistModal';
import { PlayingOverlay, PlayingHeartbeat } from '../components/common/PulseAnimations';
import { formatTime } from '../utils/format';
import { showToast } from '../utils/toast';

export default function AlbumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const isPlaying = useSelector(selectIsPlaying);
  const currentTrack = useSelector(selectCurrentTrack);

  const [playlistModalItem, setPlaylistModalItem] = useState(null);
  const [playlistModalType, setPlaylistModalType] = useState('track');

  const { data: album, isLoading, error } = useGetAlbumByIdQuery(id);
  const [recordPlay] = useRecordPlayMutation();
  const { data: likedMusic = [] } = useGetLikedMusicQuery();
  const { data: likedAlbums = [] } = useGetLikedAlbumsQuery();
  const [addLike] = useAddLikeMutation();
  const [removeLike] = useRemoveLikeMutation();

  const songs = album?.songs || [];
  const isCurrentlyPlayingAlbum = songs.some(s => s._id === currentTrack?._id) && isPlaying;
  const isAlbumLiked = likedAlbums.some(a => {
    const albId = a.targetId?._id || a.targetId?.id || a.targetId || a._id;
    return String(albId) === String(id);
  });

  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const artistName = album?.artist?.firstName
    ? `${album.artist.firstName} ${album.artist.lastName || ''}`.trim()
    : album?.artist?.username || 'PulseBeat Artist';

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

  const handleToggleAlbumLike = async () => {
    try {
      if (isAlbumLiked) {
        await removeLike({ id, targetType: 'album' }).unwrap();
        showToast(`Removed "${album.title}" from library`, 'info');
      } else {
        await addLike({ id, targetType: 'album' }).unwrap();
        showToast(`Saved "${album.title}" to library`, 'success');
      }
    } catch (err) {
      showToast(err?.data?.message || 'Action failed', 'error');
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

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 rounded-3xl bg-sidebar border border-brd" />
        <div className="h-96 rounded-2xl bg-sidebar border border-brd" />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="text-center py-20 bg-sidebar rounded-3xl border border-brd p-8 max-w-lg mx-auto mt-12 space-y-4">
        <Disc size={48} className="mx-auto text-txt-muted opacity-40" />
        <h2 className="text-2xl font-playfair font-bold text-txt">Album not found</h2>
        <p className="text-sm text-txt-sec">This album could not be loaded or is unavailable.</p>
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
          <div className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-brd bg-elevated">
            <img
              src={album.coverImage || 'https://picsum.photos/seed/album/400/400'}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-space font-bold tracking-wider uppercase bg-sidebar border border-brd text-primary" style={{ color: accentColor }}>
              <Disc size={12} /> Album
            </div>

            <h1 className="text-3xl md:text-5xl font-playfair font-black text-txt tracking-tight leading-tight">
              {album.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-txt-sec font-space">
              {album.artist?._id ? (
                <Link
                  to={`/artist/${album.artist._id}`}
                  className="font-bold text-txt hover:text-primary transition-colors flex items-center gap-2"
                >
                  {album.artist?.profilePicture && (
                    <img src={album.artist.profilePicture} className="w-5 h-5 rounded-full object-cover" alt="" />
                  )}
                  {artistName}
                </Link>
              ) : (
                <span className="font-bold text-txt">{artistName}</span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {album.createdAt ? new Date(album.createdAt).getFullYear() : '2026'}
              </span>
              <span>•</span>
              <span>{songs.length} tracks</span>
              <span>•</span>
              <span>{totalMinutes} min</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-brd/50">
          <button
            onClick={() => {
              if (isCurrentlyPlayingAlbum) dispatch(togglePlay());
              else handlePlayAll(false);
            }}
            disabled={songs.length === 0}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            style={{ backgroundColor: accentColor, color: accentTextColor }}
            title={isCurrentlyPlayingAlbum ? 'Pause' : 'Play album'}
          >
            {isCurrentlyPlayingAlbum ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handlePlayAll(true)}
            disabled={songs.length === 0}
            className="w-11 h-11 rounded-full bg-sidebar border border-brd flex items-center justify-center text-txt-sec hover:text-txt hover:bg-elevated transition-colors disabled:opacity-50"
            title="Shuffle album"
          >
            <Shuffle size={20} />
          </button>

          <button
            onClick={handleToggleAlbumLike}
            className={`w-11 h-11 rounded-full bg-sidebar border border-brd flex items-center justify-center transition-colors ${
              isAlbumLiked ? 'text-red-500 hover:bg-elevated' : 'text-txt-sec hover:text-txt hover:bg-elevated'
            }`}
            title={isAlbumLiked ? 'Remove from library' : 'Save album to library'}
          >
            <Heart size={20} className={isAlbumLiked ? 'fill-current' : ''} />
          </button>

          <TrackActionMenu
            itemType="album"
            item={{
              _id: album._id,
              title: album.title,
              artist: album.artist,
              coverImage: album.coverImage,
              songs: songs,
            }}
            onOpenPlaylistModal={(alb) => {
              setPlaylistModalItem(alb);
              setPlaylistModalType('album');
            }}
          />
        </div>
      </div>

      {/* ─── Tracklist Table ─── */}
      <div className="bg-sidebar rounded-3xl border border-brd overflow-hidden shadow-sm">
        {songs.length === 0 ? (
          <div className="text-center py-16 px-6 space-y-3">
            <Disc size={40} className="mx-auto text-txt-muted opacity-40" />
            <h3 className="text-lg font-playfair font-bold text-txt">No tracks in this album</h3>
            <p className="text-sm text-txt-sec">Songs have not been uploaded to this album yet.</p>
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

                    {/* Title + Song Avatar */}
                    <div className="col-span-6 md:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm bg-elevated">
                        <img
                          src={song.coverImage || album.coverImage || 'https://picsum.photos/seed/track/80/80'}
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
                            : song.artist?.username || artistName}
                        </p>
                      </div>
                    </div>

                    {/* Artist Column (Desktop) */}
                    <div className="hidden md:block col-span-3 text-xs text-txt-sec truncate">
                      {song.artist?.firstName
                        ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                        : song.artist?.username || artistName}
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
                        onOpenPlaylistModal={(trackItem) => {
                          setPlaylistModalItem(trackItem);
                          setPlaylistModalType('track');
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalItem)}
        onClose={() => setPlaylistModalItem(null)}
        item={playlistModalItem}
        itemType={playlistModalType}
      />
    </div>
  );
}

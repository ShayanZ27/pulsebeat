import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Play,
  Pause,
  Shuffle,
  Disc,
  ArrowLeft,
  BadgeCheck,
  Music2,
  Heart,
  UserCheck,
  UserPlus,
  Flag,
} from 'lucide-react';
import {
  useGetArtistMusicQuery,
  useGetArtistAlbumsQuery,
  useRecordPlayMutation,
  useGetLikedMusicQuery,
  useAddLikeMutation,
  useRemoveLikeMutation,
} from '../store/api';
import { playTracks, togglePlay, selectIsPlaying, selectCurrentTrack } from '../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';
import TrackActionMenu from '../components/common/TrackActionMenu';
import AddToPlaylistModal from '../components/common/AddToPlaylistModal';
import ReportModal from '../components/common/ReportModal';
import { PlayingOverlay, PlayingHeartbeat } from '../components/common/PulseAnimations';
import { formatTime } from '../utils/format';
import { showToast } from '../utils/toast';

export default function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const isPlaying = useSelector(selectIsPlaying);
  const currentTrack = useSelector(selectCurrentTrack);

  const [isFollowing, setIsFollowing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [playlistModalItem, setPlaylistModalItem] = useState(null);
  const [playlistModalType, setPlaylistModalType] = useState('track');

  const { data: songs = [], isLoading: loadingSongs } = useGetArtistMusicQuery(id);
  const { data: albums = [], isLoading: loadingAlbums } = useGetArtistAlbumsQuery(id);
  const { data: likedMusic = [] } = useGetLikedMusicQuery();
  const [recordPlay] = useRecordPlayMutation();
  const [addLike] = useAddLikeMutation();
  const [removeLike] = useRemoveLikeMutation();

  const artistInfo = songs[0]?.artist || albums[0]?.artist;
  const artistName = artistInfo?.firstName
    ? `${artistInfo.firstName} ${artistInfo.lastName || ''}`.trim()
    : artistInfo?.username || 'PulseBeat Artist';

  const isCurrentlyPlayingArtist = songs.some(s => s._id === currentTrack?._id) && isPlaying;
  const totalPlays = songs.reduce((acc, s) => acc + (s.plays || 0), 0);

  const handlePlayAll = (shuffle = false) => {
    if (!songs.length) return;
    let list = [...songs];
    if (shuffle) list.sort(() => Math.random() - 0.5);
    dispatch(playTracks(list, 0));
    const first = list[0];
    if (first?._id && !String(first._id).startsWith('sample-')) {
      recordPlay(first._id).catch(() => {});
    }
  };

  const handlePlaySingle = (song, idx) => {
    dispatch(playTracks(songs, idx));
    if (song?._id && !String(song._id).startsWith('sample-')) {
      recordPlay(song._id).catch(() => {});
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

  const handleToggleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    showToast(nextState ? `Following ${artistName}` : `Unfollowed ${artistName}`, 'info');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-space font-bold uppercase tracking-wider text-txt-muted hover:text-txt transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Artist Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 border border-brd bg-gradient-to-br from-sidebar via-elevated to-sidebar shadow-md">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ backgroundColor: accentColor }} />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
          <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden shadow-2xl border-4 border-sidebar shrink-0 bg-elevated">
            <img
              src={artistInfo?.profilePicture || 'https://picsum.photos/seed/artistprofile/400/400'}
              alt={artistName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-space font-bold uppercase tracking-wider bg-sidebar border border-brd text-primary" style={{ color: accentColor }}>
              <BadgeCheck size={14} /> Verified Artist
            </div>

            <h1 className="text-3xl md:text-6xl font-playfair font-black text-txt tracking-tight">
              {artistName}
            </h1>

            <p className="text-sm text-txt-sec font-space">
              {songs.length} Tracks • {albums.length} Albums • {totalPlays.toLocaleString()} total plays
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <button
                onClick={() => {
                  if (isCurrentlyPlayingArtist) dispatch(togglePlay());
                  else handlePlayAll(false);
                }}
                disabled={songs.length === 0}
                className="h-12 px-6 py-3 rounded-full flex items-center gap-2 text-sm font-space font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
                style={{ backgroundColor: accentColor, color: accentTextColor }}
              >
                {isCurrentlyPlayingArtist ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
                {isCurrentlyPlayingArtist ? 'Pause' : 'Play All'}
              </button>

              <button
                onClick={() => handlePlayAll(true)}
                disabled={songs.length === 0}
                className="w-12 h-12 rounded-full bg-sidebar border border-brd flex items-center justify-center text-txt-sec hover:text-txt hover:bg-elevated transition-colors disabled:opacity-50"
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={handleToggleFollow}
                className={`px-5 py-2.5 rounded-full text-xs font-space font-bold border transition-all flex items-center gap-2 ${
                  isFollowing
                    ? 'bg-elevated border-primary text-primary'
                    : 'bg-sidebar border-brd text-txt-sec hover:text-txt hover:bg-elevated'
                }`}
                style={isFollowing ? { borderColor: accentColor, color: accentColor } : undefined}
              >
                {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="w-12 h-12 rounded-full bg-sidebar border border-brd flex items-center justify-center text-txt-sec hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                title="Report Artist"
                aria-label="Report Artist"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Tracks */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">Popular Tracks</h2>
        <div className="bg-sidebar rounded-3xl border border-brd overflow-hidden shadow-sm">
          {loadingSongs ? (
            <div className="p-8 text-center text-txt-muted text-sm animate-pulse">Loading songs...</div>
          ) : songs.length === 0 ? (
            <div className="p-8 text-center text-txt-muted text-sm">No songs found for this artist.</div>
          ) : (
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

                    <div className="col-span-7 md:col-span-8 flex items-center gap-3 min-w-0 pr-2">
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
                        <p className="text-xs text-txt-sec truncate">{song.plays || 0} plays</p>
                      </div>
                    </div>

                    <div className="col-span-4 md:col-span-3 flex items-center justify-end gap-2 pr-2">
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
          )}
        </div>
      </section>

      {/* Discography */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <div
                key={album._id}
                onClick={() => navigate(`/album/${album._id}`)}
                className="group p-3.5 rounded-2xl bg-sidebar hover:bg-elevated border border-brd transition-all hover:shadow-md cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-sm">
                  <img
                    src={album.coverImage || 'https://picsum.photos/seed/album/300/300'}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-sm font-bold text-txt truncate group-hover:text-primary transition-colors">
                  {album.title}
                </p>
                <p className="text-xs text-txt-sec truncate mt-0.5">
                  Album • {album.songs?.length || 0} songs
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalItem)}
        onClose={() => setPlaylistModalItem(null)}
        item={playlistModalItem}
        itemType={playlistModalType}
      />

      {/* Report Artist Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        item={{
          _id: artistInfo?._id || id,
          title: artistName,
          name: artistName,
          username: artistInfo?.username,
          profilePicture: artistInfo?.profilePicture,
        }}
        itemType="user"
      />
    </div>
  );
}

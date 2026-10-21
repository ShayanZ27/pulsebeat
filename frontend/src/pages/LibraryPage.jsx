import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Heart,
  Plus,
  Play,
  Music2,
  Disc,
  Library as LibraryIcon,
} from 'lucide-react';
import {
  useGetUserPlaylistsQuery,
  useGetLikedMusicQuery,
  useGetLikedAlbumsQuery,
  useGetLikedPlaylistsQuery,
  useRecordPlayMutation,
  useRemoveLikeMutation,
} from '../store/api';
import { playTracks, selectCurrentTrack, selectIsPlaying } from '../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';
import CreatePlaylistModal from '../components/common/CreatePlaylistModal';
import TrackActionMenu from '../components/common/TrackActionMenu';
import { PlayingOverlay } from '../components/common/PulseAnimations';
import { formatTime } from '../utils/format';
import { showToast } from '../utils/toast';

export default function LibraryPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const [activeTab, setActiveTab] = useState('all'); // all, playlists, songs, albums
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: userPlaylists = [], isLoading: loadingPlaylists } = useGetUserPlaylistsQuery();
  const { data: rawLikedSongs = [], isLoading: loadingLikes } = useGetLikedMusicQuery();
  const { data: rawLikedAlbums = [], isLoading: loadingAlbums } = useGetLikedAlbumsQuery();
  const { data: rawLikedPlaylists = [], isLoading: loadingLikedPlaylists } = useGetLikedPlaylistsQuery();
  const [recordPlay] = useRecordPlayMutation();
  const [removeLike] = useRemoveLikeMutation();

  // Normalize liked items (unwrap targetId if it exists)
  const likedSongs = rawLikedSongs
    .map(item => item.targetId || item)
    .filter(song => song && song._id);

  const likedAlbums = rawLikedAlbums
    .map(item => item.targetId || item)
    .filter(album => album && album._id);

  const userPlaylistIds = new Set(userPlaylists.map(p => String(p._id)));
  const likedPlaylists = rawLikedPlaylists
    .map(item => item.targetId || item)
    .filter(pl => pl && pl._id && !userPlaylistIds.has(String(pl._id)));

  const handlePlayLikedSongs = (e) => {
    if (e) e.stopPropagation();
    if (likedSongs.length > 0) {
      dispatch(playTracks(likedSongs, 0));
      const first = likedSongs[0];
      if (first?._id && !String(first._id).startsWith('sample-')) {
        recordPlay(first._id).catch(() => {});
      }
    }
  };

  const handlePlaySingle = (song, idx) => {
    dispatch(playTracks(likedSongs, idx));
    if (song?._id && !String(song._id).startsWith('sample-')) {
      recordPlay(song._id).catch(() => {});
    }
  };

  const handleUnlikeTrack = async (e, song) => {
    e.stopPropagation();
    try {
      await removeLike({ id: song._id, targetType: 'music' }).unwrap();
      showToast(`Removed "${song.title}" from Liked Songs`, 'info');
    } catch (err) {
      showToast(err?.data?.message || 'Action failed', 'error');
    }
  };

  const totalPlaylistsCount = userPlaylists.length + likedPlaylists.length;
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'playlists', label: `Playlists (${totalPlaylistsCount})` },
    { id: 'songs', label: `Liked Songs (${likedSongs.length})` },
    { id: 'albums', label: `Albums (${likedAlbums.length})` },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-space font-bold uppercase tracking-wider mb-2 bg-sidebar border border-brd text-primary" style={{ color: accentColor }}>
            <LibraryIcon size={14} /> Your Collection
          </div>
          <h1 className="text-3xl md:text-5xl font-playfair font-black text-txt tracking-tight">
            Your Library
          </h1>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-space font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
          style={{ backgroundColor: accentColor, color: accentTextColor }}
        >
          <Plus size={18} /> Create Playlist
        </button>
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-space font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'shadow-md scale-105'
                  : 'bg-sidebar border border-brd text-txt-sec hover:text-txt hover:bg-elevated'
              }`}
              style={
                isActive
                  ? { backgroundColor: accentColor, color: accentTextColor, borderColor: accentColor }
                  : undefined
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── VIEW 1: LIKED SONGS DEDICATED TABLE VIEW ─── */}
      {activeTab === 'songs' ? (
        <div className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden p-6 md:p-8 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-5">
              <span className="p-4 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm">
                <Heart size={32} className="fill-white" />
              </span>
              <div>
                <h2 className="text-2xl md:text-3xl font-playfair font-black">Liked Songs</h2>
                <p className="text-xs font-space text-white/80 mt-1">
                  {likedSongs.length} {likedSongs.length === 1 ? 'track' : 'tracks'}
                </p>
              </div>
            </div>

            {likedSongs.length > 0 && (
              <button
                onClick={handlePlayLikedSongs}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
                title="Play all liked songs"
              >
                <Play size={24} className="fill-black ml-0.5" />
              </button>
            )}
          </div>

          <div className="bg-sidebar rounded-3xl border border-brd overflow-hidden shadow-sm">
            {likedSongs.length === 0 ? (
              <div className="text-center py-16 text-txt-muted text-sm space-y-2">
                <Heart size={36} className="mx-auto opacity-40 text-txt-muted" />
                <p>Songs you like will appear here.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-12 gap-2 p-4 px-6 border-b border-brd text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
                  <span className="col-span-1 text-center">#</span>
                  <span className="col-span-7 md:col-span-6">Title</span>
                  <span className="hidden md:block col-span-3">Artist</span>
                  <span className="col-span-4 md:col-span-2 text-right pr-2">Duration</span>
                </div>

                <div className="divide-y divide-brd/40">
                  {likedSongs.map((song, idx) => {
                    const isThisPlaying = currentTrack?._id === song._id && isPlaying;
                    return (
                      <div
                        key={song._id || idx}
                        onClick={() => handlePlaySingle(song, idx)}
                        className={`grid grid-cols-12 gap-2 items-center p-3.5 px-6 hover:bg-elevated transition-colors cursor-pointer group select-none ${
                          currentTrack?._id === song._id ? 'bg-elevated/70' : ''
                        }`}
                      >
                        <div className="col-span-1 flex items-center justify-center">
                          <span
                            className={`group-hover:hidden text-xs font-space font-bold ${
                              isThisPlaying ? 'text-primary' : 'text-txt-muted'
                            } flex items-center justify-center`}
                            style={isThisPlaying ? { color: accentColor } : undefined}
                          >
                            {idx + 1}
                          </span>
                          <Play size={16} className="hidden group-hover:block fill-current" style={{ color: accentColor }} />
                        </div>

                        <div className="col-span-7 md:col-span-6 flex items-center gap-3 min-w-0 pr-2">
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

                        <div className="hidden md:block col-span-3 text-xs text-txt-sec truncate">
                          {song.artist?.firstName
                            ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                            : song.artist?.username || 'Artist'}
                        </div>

                        <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2 pr-2">
                          <button
                            onClick={(e) => handleUnlikeTrack(e, song)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:text-red-400 transition-colors"
                            title="Unlike"
                          >
                            <Heart size={16} className="fill-current" />
                          </button>
                          <span className="text-xs font-space text-txt-muted">
                            {formatTime(song.duration)}
                          </span>
                          <TrackActionMenu item={song} itemType="track" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── VIEW 2: TILES / GRIDS (ALL, PLAYLISTS, ALBUMS) ─── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* 1. Liked Songs Tile */}
          {activeTab === 'all' && (
            <div
              onClick={() => setActiveTab('songs')}
              className="group relative col-span-2 sm:col-span-2 md:col-span-2 h-56 rounded-2xl p-6 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="p-3 rounded-full bg-white/20 backdrop-blur-md">
                  <Heart size={24} className="fill-white" />
                </span>
                <button
                  onClick={handlePlayLikedSongs}
                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
                  title="Play all liked songs"
                >
                  <Play size={20} className="fill-black ml-0.5" />
                </button>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-playfair font-black tracking-tight leading-tight">
                  Liked Songs
                </h2>
                <p className="text-xs font-space text-white/80 mt-1">
                  {likedSongs.length} {likedSongs.length === 1 ? 'favorite track' : 'favorite tracks'}
                </p>
              </div>
            </div>
          )}

          {/* 2. User Playlists */}
          {(activeTab === 'all' || activeTab === 'playlists') &&
            userPlaylists.map((pl) => (
              <div
                key={pl._id}
                onClick={() => navigate(`/playlist/${pl._id}`)}
                className="group p-3.5 rounded-2xl bg-sidebar hover:bg-elevated border border-brd transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-sm bg-elevated flex items-center justify-center">
                    {pl.coverImage ? (
                      <img
                        src={pl.coverImage}
                        alt={pl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Music2 size={36} className="text-txt-muted opacity-50" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-txt truncate group-hover:text-primary transition-colors">
                    {pl.name}
                  </p>
                  <p className="text-xs text-txt-sec truncate mt-0.5">
                    Playlist • {pl.songs?.length || 0} songs
                  </p>
                </div>
              </div>
            ))}

          {/* 2b. Liked Community Playlists */}
          {(activeTab === 'all' || activeTab === 'playlists') &&
            likedPlaylists.map((pl) => {
              const ownerName = pl.owner?.firstName
                ? `${pl.owner.firstName} ${pl.owner.lastName || ''}`.trim()
                : pl.owner?.username || 'Community';
              return (
                <div
                  key={`liked-${pl._id}`}
                  onClick={() => navigate(`/playlist/${pl._id}`)}
                  className="group p-3.5 rounded-2xl bg-sidebar hover:bg-elevated border border-brd transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-sm bg-elevated flex items-center justify-center">
                      {pl.coverImage ? (
                        <img
                          src={pl.coverImage}
                          alt={pl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Music2 size={36} className="text-txt-muted opacity-50" />
                      )}
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-red-500 shadow-sm">
                        <Heart size={12} className="fill-current" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-txt truncate group-hover:text-primary transition-colors">
                      {pl.name}
                    </p>
                    <p className="text-xs text-txt-sec truncate mt-0.5">
                      Playlist • {ownerName}
                    </p>
                  </div>
                </div>
              );
            })}

          {/* 3. Saved Albums */}
          {(activeTab === 'all' || activeTab === 'albums') &&
            likedAlbums.map((album) => (
              <div
                key={album._id}
                onClick={() => navigate(`/album/${album._id}`)}
                className="group p-3.5 rounded-2xl bg-sidebar hover:bg-elevated border border-brd transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-sm bg-elevated">
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
                    Album • {album.artist?.firstName
                      ? `${album.artist.firstName} ${album.artist.lastName || ''}`.trim()
                      : album.artist?.username || 'Artist'}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {!loadingPlaylists && !loadingLikes && !loadingAlbums && !loadingLikedPlaylists && userPlaylists.length === 0 && likedPlaylists.length === 0 && likedSongs.length === 0 && likedAlbums.length === 0 && (
        <div className="text-center py-16 bg-sidebar rounded-3xl border border-brd p-8 max-w-md mx-auto space-y-3">
          <LibraryIcon size={44} className="mx-auto text-txt-muted opacity-40" />
          <h3 className="text-lg font-playfair font-bold text-txt">Your Library is empty</h3>
          <p className="text-xs text-txt-sec">
            Like songs, save albums, and create playlists to build your collection.
          </p>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <CreatePlaylistModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

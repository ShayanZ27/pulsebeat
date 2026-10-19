import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  Check,
  FolderPlus,
  Music,
  Plus,
  X,
} from 'lucide-react';
import {
  useAddToPlaylistMutation,
  useCreatePlaylistMutation,
  useGetAlbumByIdQuery,
  useGetUserPlaylistsQuery,
} from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { getDisplayName } from '../../utils/format';
import { showToast } from '../../utils/toast';
import { HeartbeatLoader } from './PulseAnimations';

export default function AddToPlaylistModal({
  isOpen = false,
  onClose,
  item = null,
  itemType = 'track',
}) {
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const { data: playlists = [], isLoading: isLoadingPlaylists } = useGetUserPlaylistsQuery(undefined, {
    skip: !isOpen,
  });
  const [addToPlaylist, { isLoading: isAdding }] = useAddToPlaylistMutation();
  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation();

  const isAlbum = itemType === 'album';
  const itemId = item?._id || item?.id;

  const { data: fullAlbum } = useGetAlbumByIdQuery(itemId, {
    skip: !isOpen || !isAlbum || Boolean(item?.songs?.length),
  });

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [successPlaylistId, setSuccessPlaylistId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setNewPlaylistName('');
      setShowCreateInput(false);
      setSuccessPlaylistId(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const albumSongs = item.songs?.length ? item.songs : (fullAlbum?.songs || []);
  const targetTitle = item.title || item.name || fullAlbum?.title || 'Untitled';
  const targetSubtitle = isAlbum
    ? `${albumSongs.length} tracks • ${getDisplayName(item.artist || fullAlbum?.artist)}`
    : getDisplayName(item.artist, item.artistName || 'Artist');
  const targetCover = item.coverImage || fullAlbum?.coverImage || (item.img ? `https://picsum.photos/seed/${item.img}/80/80` : null);

  const targetSongId = !isAlbum ? itemId : undefined;
  const targetSongIds = isAlbum
    ? albumSongs.map((s) => s?._id || s?.id || s).filter(Boolean)
    : undefined;

  const handleSelectPlaylist = async (playlist) => {
    setErrorMessage(null);
    try {
      await addToPlaylist({
        playlistId: playlist._id,
        songId: targetSongId,
        songIds: targetSongIds,
      }).unwrap();

      setSuccessPlaylistId(playlist._id);
      showToast(`Added to ${playlist.name}`);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Could not add to playlist';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;

    setErrorMessage(null);
    try {
      const newPl = await createPlaylist({
        name: trimmed,
        description: 'Created on PulseBeat',
        isPublic: true,
      }).unwrap();

      const createdId = newPl._id || newPl.data?._id;
      if (createdId) {
        await addToPlaylist({
          playlistId: createdId,
          songId: targetSongId,
          songIds: targetSongIds,
        }).unwrap();
      }

      setSuccessPlaylistId(createdId);
      showToast(`Created & added to ${trimmed}`);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to create playlist';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  return createPortal(
    <div
      data-add-to-playlist-modal="true"
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-10000 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        data-add-to-playlist-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-sidebar/95 backdrop-blur-2xl border border-brd rounded-t-4xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-brd flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              <FolderPlus size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-space font-bold text-txt truncate">Add to Playlist</h3>
              <p className="text-xs text-txt-muted truncate">
                {isAlbum ? 'Album: ' : 'Track: '}
                <span className="font-semibold text-txt">{targetTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-elevated hover:bg-elevated/80 border border-brd flex items-center justify-center text-txt-muted hover:text-txt transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected Item Summary Pill */}
        <div className="px-6 py-3 bg-elevated/40 border-b border-brd flex items-center gap-3">
          {targetCover ? (
            <img src={targetCover} alt={targetTitle} className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-card border border-brd flex items-center justify-center shrink-0 text-txt-muted">
              <Music size={16} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-txt truncate">{targetTitle}</p>
            <p className="text-[11px] text-txt-muted truncate">{targetSubtitle}</p>
          </div>
        </div>

        {/* Error message if duplicate or error */}
        {errorMessage && (
          <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 text-xs font-semibold text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide max-h-80">
          {isLoadingPlaylists ? (
            <div className="py-8">
              <HeartbeatLoader variant="block" size={24} text="Loading playlists..." color={accentColor} />
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-8 text-center text-txt-muted">
              <p className="text-sm font-semibold mb-1">No playlists found</p>
              <p className="text-xs">Create your first playlist below to get started.</p>
            </div>
          ) : (
            playlists.map((playlist) => {
              const playlistSongs = playlist.songs || [];
              const isAdded = successPlaylistId === playlist._id;

              // Check if track or album is already in this playlist
              let alreadyPresent = false;
              if (isAlbum) {
                const albumIds = targetSongIds || [];
                const matches = playlistSongs.filter((s) => albumIds.includes(String(s._id || s))).length;
                alreadyPresent = albumIds.length > 0 && matches === albumIds.length;
              } else {
                alreadyPresent = playlistSongs.some((s) => String(s._id || s) === String(targetSongId));
              }

              return (
                <button
                  key={playlist._id}
                  disabled={alreadyPresent || isAdding}
                  onClick={() => handleSelectPlaylist(playlist)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer group ${
                    isAdded
                      ? 'bg-primary/20 border border-primary/40'
                      : alreadyPresent
                      ? 'opacity-60 bg-transparent hover:bg-elevated/40 cursor-not-allowed'
                      : 'hover:bg-elevated border border-transparent hover:border-brd'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-card border border-brd shrink-0 flex items-center justify-center text-txt-muted shadow-sm">
                      {playlist.coverImage ? (
                        <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderPlus size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-txt truncate group-hover:text-primary transition-colors">
                        {playlist.name}
                      </p>
                      <p className="text-[11px] font-medium text-txt-muted">
                        {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 ml-3">
                    {isAdded ? (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-black shadow-sm animate-in zoom-in-75 duration-200">
                        <Check size={12} strokeWidth={3} /> Added
                      </span>
                    ) : alreadyPresent ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-elevated text-txt-muted border border-brd">
                        <Check size={12} /> Already added
                      </span>
                    ) : (
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-txt-muted group-hover:text-primary group-hover:bg-card border border-transparent group-hover:border-brd transition-all">
                        <Plus size={16} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create Playlist Footer */}
        <div className="p-4 border-t border-brd bg-sidebar">
          {showCreateInput ? (
            <form onSubmit={handleCreateAndAdd} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="New playlist name..."
                value={newPlaylistName}
                maxLength={50}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 bg-elevated border border-brd rounded-xl px-3.5 py-2.5 text-sm text-txt outline-none focus:border-primary placeholder:text-txt-muted transition-colors"
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim() || isCreating}
                className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                style={{ backgroundColor: accentColor, color: accentTextColor }}
              >
                {isCreating ? <HeartbeatLoader size={16} color={accentTextColor} /> : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateInput(false);
                  setNewPlaylistName('');
                }}
                className="p-2.5 rounded-xl border border-brd text-txt-muted hover:text-txt text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-brd hover:border-primary text-xs font-bold text-txt-sec hover:text-primary hover:bg-elevated/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={15} /> Create New Playlist
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

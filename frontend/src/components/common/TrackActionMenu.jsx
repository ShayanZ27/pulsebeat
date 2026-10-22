import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Flag,
  FolderPlus,
  Heart,
  HeartOff,
  ListMusic,
  ListPlus,
  MoreHorizontal,
  MoreVertical,
  Share2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  useAddLikeMutation,
  useGetAlbumByIdQuery,
  useGetLikedAlbumsQuery,
  useGetLikedMusicQuery,
  useGetLikedPlaylistsQuery,
  useRemoveLikeMutation,
  useAdminHideContentMutation,
  useAdminRestoreContentMutation,
} from '../../store/api';
import { addToQueue, playNext } from '../../store/playerSlice';
import { selectCurrentUser } from '../../store/authSlice';
import { showToast } from '../../utils/toast';
import AddToPlaylistModal from './AddToPlaylistModal';
import ReportModal from './ReportModal';

export default function TrackActionMenu({
  item: propItem,
  track,
  itemType = 'track',
  onOpenPlaylistModal,
  onRemove,
  removeLabel = 'Remove from playlist',
  triggerClassName = '',
  buttonSize = 32,
  iconSize = 16,
  direction = 'horizontal',
  align = 'right',
}) {
  const item = propItem || track;
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = currentUser?.role === 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [internalPlaylistOpen, setInternalPlaylistOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const [addLike] = useAddLikeMutation();
  const [removeLike] = useRemoveLikeMutation();
  const [adminHideContent] = useAdminHideContentMutation();
  const [adminRestoreContent] = useAdminRestoreContentMutation();

  const isAlbum = itemType === 'album';
  const isPlaylist = itemType === 'playlist';
  const itemId = item?._id || item?.id;

  const { data: likedMusic = [] } = useGetLikedMusicQuery(undefined, {
    skip: isAlbum || isPlaylist || !itemId,
  });
  const { data: likedAlbums = [] } = useGetLikedAlbumsQuery(undefined, {
    skip: !isAlbum || !itemId,
  });
  const { data: likedPlaylists = [] } = useGetLikedPlaylistsQuery(undefined, {
    skip: !isPlaylist || !itemId,
  });

  const { data: fullAlbum } = useGetAlbumByIdQuery(itemId, {
    skip: !isAlbum || Boolean(item?.songs?.length),
  });
  const albumSongs = item?.songs?.length ? item.songs : (fullAlbum?.songs || []);

  const isLikedInDb = isAlbum
    ? likedAlbums.some((l) => String(l.targetId?._id || l.targetId?.id || l.targetId) === String(itemId))
    : isPlaylist
    ? likedPlaylists.some((l) => String(l.targetId?._id || l.targetId?.id || l.targetId) === String(itemId))
    : likedMusic.some((l) => String(l.targetId?._id || l.targetId?.id || l.targetId) === String(itemId));

  const isLiked = item?.isLiked !== undefined ? item.isLiked : isLikedInDb;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 270;

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    if (left + menuWidth > window.innerWidth - 16) {
      left = window.innerWidth - menuWidth - 16;
    }
    if (left < 16) left = 16;

    let top = rect.bottom + 6;
    if (top + menuHeight > window.innerHeight - 16) {
      top = rect.top - menuHeight - 6;
    }

    setCoords({ top, left });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on click outside, scroll, resize, or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePlayNext = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!item) return;

    if (isAlbum) {
      if (albumSongs.length) {
        dispatch(playNext(albumSongs));
        showToast(`Playing "${item.title || fullAlbum?.title || 'album'}" next`);
      } else {
        showToast('No songs found in album', 'info');
      }
    } else if (isPlaylist) {
      if (item.songs?.length) {
        dispatch(playNext(item.songs));
        showToast(`Playing "${item.name || 'playlist'}" next`);
      } else {
        showToast('No songs found in playlist', 'info');
      }
    } else {
      dispatch(playNext(item));
      showToast(`Playing "${item.title || item.name || 'song'}" next`);
    }
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!item) return;

    if (isAlbum) {
      if (albumSongs.length) {
        dispatch(addToQueue(albumSongs));
        showToast(`Added ${albumSongs.length} songs to queue`);
      } else {
        showToast('No songs found in album', 'info');
      }
    } else if (isPlaylist) {
      if (item.songs?.length) {
        dispatch(addToQueue(item.songs));
        showToast(`Added ${item.songs.length} songs to queue`);
      } else {
        showToast('No songs found in playlist', 'info');
      }
    } else {
      dispatch(addToQueue(item));
      showToast(`Added "${item.title || item.name || 'song'}" to queue`);
    }
  };

  const handleOpenPlaylist = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onOpenPlaylistModal) {
      onOpenPlaylistModal(item, itemType);
    } else {
      setInternalPlaylistOpen(true);
    }
  };

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!itemId) {
      showToast(isLiked ? 'Removed from your library' : 'Saved to your library');
      return;
    }

    const title = item.title || item.name || (isAlbum ? 'Album' : isPlaylist ? 'Playlist' : 'Song');
    const targetType = isAlbum ? 'album' : isPlaylist ? 'playlist' : 'music';

    try {
      if (isLiked) {
        await removeLike({
          id: itemId,
          targetType,
        }).unwrap();
        showToast(
          isAlbum || isPlaylist
            ? `Removed "${title}" from your library`
            : `Removed "${title}" from Liked Songs`
        );
      } else {
        await addLike({
          id: itemId,
          targetType,
        }).unwrap();
        showToast(
          isAlbum || isPlaylist
            ? `Saved "${title}" to your library`
            : `Added "${title}" to Liked Songs`
        );
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Could not update library';
      showToast(msg, 'error');
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    const targetId = item?._id || item?.id;
    const targetPath = isAlbum ? 'album' : isPlaylist ? 'playlist' : 'track';
    const shareUrl = targetId
      ? `${window.location.origin}/${targetPath}/${targetId}`
      : window.location.href;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {
        showToast('Link copied to clipboard!');
      });
    } else {
      showToast('Link copied to clipboard!');
    }
  };

  const handleReport = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsReportModalOpen(true);
  };

  const handleAdminToggleSuspend = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    const contentType = isAlbum ? 'album' : 'music';
    try {
      if (item?.isSuspended) {
        await adminRestoreContent({ contentId: itemId, type: contentType }).unwrap();
        showToast.success(`${isAlbum ? 'Album' : 'Track'} restored successfully`);
      } else {
        await adminHideContent({ contentId: itemId, type: contentType }).unwrap();
        showToast.success(`${isAlbum ? 'Album' : 'Track'} suspended`);
      }
    } catch (err) {
      showToast.error(err?.data?.message || err?.message || 'Action failed');
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-track-action-menu-trigger="true"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={handleToggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-txt-muted hover:text-txt hover:bg-elevated/80 transition-all cursor-pointer ${triggerClassName}`}
        style={{ width: buttonSize, height: buttonSize }}
        title="More options"
        aria-label="More options"
      >
        {direction === 'vertical' ? (
          <MoreVertical size={iconSize} />
        ) : (
          <MoreHorizontal size={iconSize} />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            data-track-action-menu="true"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className="track-action-menu-portal w-60 py-2 rounded-2xl bg-sidebar/95 backdrop-blur-2xl border border-brd shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none text-left"
          >
            {/* Play Next */}
            <button
              type="button"
              onClick={handlePlayNext}
              className="w-full px-4 py-2.5 text-xs font-semibold text-txt hover:bg-elevated/80 hover:text-primary transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
            >
              <ListPlus size={15} className="shrink-0 text-txt-muted" />
              <span className="text-left whitespace-nowrap flex-1">Play Next</span>
            </button>

            {/* Add to Queue */}
            <button
              type="button"
              onClick={handleAddToQueue}
              className="w-full px-4 py-2.5 text-xs font-semibold text-txt hover:bg-elevated/80 hover:text-primary transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
            >
              <ListMusic size={15} className="shrink-0 text-txt-muted" />
              <span className="text-left whitespace-nowrap flex-1">Add to Queue</span>
            </button>

            <div className="my-1.5 border-t border-brd/60" />

            {/* Add to Playlist (for tracks and albums) */}
            {!isPlaylist && (
              <button
                type="button"
                onClick={handleOpenPlaylist}
                className="w-full px-4 py-2.5 text-xs font-semibold text-txt hover:bg-elevated/80 hover:text-primary transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
              >
                <FolderPlus size={15} className="shrink-0 text-txt-muted" />
                <span className="text-left whitespace-nowrap flex-1">Add to Playlist</span>
              </button>
            )}

            {/* Like / Unlike */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`w-full px-4 py-2.5 text-xs font-semibold transition-colors flex items-center gap-3 cursor-pointer group text-left whitespace-nowrap ${
                isLiked
                  ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                  : 'text-txt hover:bg-elevated/80 hover:text-primary'
              }`}
            >
              {isLiked ? (
                <HeartOff size={15} className="shrink-0 text-red-400" />
              ) : (
                <Heart size={15} className="shrink-0 text-txt-muted group-hover:text-primary" />
              )}
              <span className="text-left whitespace-nowrap flex-1">
                {isLiked
                  ? isAlbum || isPlaylist
                    ? 'Remove from Your Library'
                    : 'Remove from Liked Songs'
                  : isAlbum
                  ? 'Save Album to Library'
                  : isPlaylist
                  ? 'Save Playlist to Library'
                  : 'Save to Liked Songs'}
              </span>
            </button>

            <div className="my-1.5 border-t border-brd/60" />

            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onRemove();
                }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
              >
                <Trash2 size={15} className="shrink-0 text-red-400" />
                <span className="text-left whitespace-nowrap flex-1">{removeLabel}</span>
              </button>
            )}

            {/* Copy Link / Share */}
            <button
              type="button"
              onClick={handleShare}
              className="w-full px-4 py-2.5 text-xs font-semibold text-txt hover:bg-elevated/80 hover:text-primary transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
            >
              <Share2 size={15} className="shrink-0 text-txt-muted" />
              <span className="text-left whitespace-nowrap flex-1">Share Link</span>
            </button>

            {/* Report or Admin Suspend */}
            {itemType !== 'playlist' && (
              isAdmin ? (
                <button
                  type="button"
                  onClick={handleAdminToggleSuspend}
                  className={`w-full px-4 py-2.5 text-xs font-semibold transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap ${
                    item?.isSuspended
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  {item?.isSuspended ? (
                    <ShieldCheck size={15} className="shrink-0 text-emerald-400" />
                  ) : (
                    <ShieldAlert size={15} className="shrink-0 text-amber-400" />
                  )}
                  <span className="text-left whitespace-nowrap flex-1">
                    {item?.isSuspended
                      ? `Restore ${isAlbum ? 'Album' : 'Track'}`
                      : `Suspend ${isAlbum ? 'Album' : 'Track'}`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReport}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-txt hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap group/report"
                >
                  <Flag size={15} className="shrink-0 text-txt-muted group-hover/report:text-red-400 transition-colors" />
                  <span className="text-left whitespace-nowrap flex-1">Report</span>
                </button>
              )
            )}
          </div>,
          document.body
        )}

      {!onOpenPlaylistModal && (
        <AddToPlaylistModal
          isOpen={internalPlaylistOpen}
          onClose={() => setInternalPlaylistOpen(false)}
          item={item}
          itemType={itemType}
        />
      )}

      {itemType !== 'playlist' && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          item={item}
          itemType={itemType}
        />
      )}
    </>
  );
}

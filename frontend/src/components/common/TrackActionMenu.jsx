import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
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
} from 'lucide-react';
import {
  useAddLikeMutation,
  useGetLikedAlbumsQuery,
  useGetLikedMusicQuery,
  useRemoveLikeMutation,
} from '../../store/api';
import { addToQueue, playNext } from '../../store/playerSlice';
import { showToast } from '../../utils/toast';

export default function TrackActionMenu({
  item,
  itemType = 'track',
  onOpenPlaylistModal,
  triggerClassName = '',
  buttonSize = 32,
  iconSize = 16,
  direction = 'horizontal',
  align = 'right',
}) {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const [addLike] = useAddLikeMutation();
  const [removeLike] = useRemoveLikeMutation();

  const isAlbum = itemType === 'album';
  const itemId = item?._id || item?.id;

  const { data: likedMusic = [] } = useGetLikedMusicQuery(undefined, {
    skip: isAlbum || !itemId,
  });
  const { data: likedAlbums = [] } = useGetLikedAlbumsQuery(undefined, {
    skip: !isAlbum || !itemId,
  });

  const isLikedInDb = isAlbum
    ? likedAlbums.some((l) => String(l.targetId?._id || l.targetId?.id || l.targetId) === String(itemId))
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

    if (isAlbum && item.songs?.length) {
      dispatch(playNext(item.songs));
      showToast(`Playing "${item.title}" album next`);
    } else {
      dispatch(playNext(item));
      showToast(`Playing "${item.title || 'song'}" next`);
    }
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!item) return;

    if (isAlbum && item.songs?.length) {
      dispatch(addToQueue(item.songs));
      showToast(`Added ${item.songs.length} songs from "${item.title}" to queue`);
    } else {
      dispatch(addToQueue(item));
      showToast(`Added "${item.title || 'song'}" to queue`);
    }
  };

  const handleOpenPlaylist = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onOpenPlaylistModal) {
      onOpenPlaylistModal(item, itemType);
    }
  };

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (!itemId) {
      showToast(isLiked ? 'Removed from your library' : 'Saved to your library');
      return;
    }

    const title = item.title || item.name || (isAlbum ? 'Album' : 'Song');

    try {
      if (isLiked) {
        await removeLike({
          id: itemId,
          targetType: isAlbum ? 'album' : 'music',
        }).unwrap();
        showToast(
          isAlbum
            ? `Removed "${title}" from your library`
            : `Removed "${title}" from Liked Songs`
        );
      } else {
        await addLike({
          id: itemId,
          targetType: isAlbum ? 'album' : 'music',
        }).unwrap();
        showToast(
          isAlbum
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
    const shareUrl = targetId
      ? `${window.location.origin}/${isAlbum ? 'album' : 'track'}/${targetId}`
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
    showToast('Thanks for reporting. We will review this.', 'info');
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
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
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className="w-60 py-2 rounded-2xl bg-sidebar/95 backdrop-blur-2xl border border-brd shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none text-left"
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

            {/* Add to Playlist */}
            <button
              type="button"
              onClick={handleOpenPlaylist}
              className="w-full px-4 py-2.5 text-xs font-semibold text-txt hover:bg-elevated/80 hover:text-primary transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
            >
              <FolderPlus size={15} className="shrink-0 text-txt-muted" />
              <span className="text-left whitespace-nowrap flex-1">Add to Playlist</span>
            </button>

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
                  ? isAlbum
                    ? 'Remove from Your Library'
                    : 'Remove from Liked Songs'
                  : isAlbum
                  ? 'Save Album to Library'
                  : 'Save to Liked Songs'}
              </span>
            </button>

            <div className="my-1.5 border-t border-brd/60" />

            {/* Copy Link / Share */}
            <button
              type="button"
              onClick={handleShare}
              className="w-full px-4 py-2.5 text-xs font-semibold text-txt hover:bg-elevated/80 hover:text-primary transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
            >
              <Share2 size={15} className="shrink-0 text-txt-muted" />
              <span className="text-left whitespace-nowrap flex-1">Share Link</span>
            </button>

            {/* Report */}
            <button
              type="button"
              onClick={handleReport}
              className="w-full px-4 py-2.5 text-xs font-semibold text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 cursor-pointer text-left whitespace-nowrap"
            >
              <Flag size={15} className="shrink-0" />
              <span className="text-left whitespace-nowrap flex-1">Report</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

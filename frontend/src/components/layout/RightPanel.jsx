import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GripVertical,
  Heart,
  ListMusic,
  Music2,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import {
  useGetActivityFeedQuery,
  useGetRecentlyPlayedQuery,
} from '../../store/api';
import {
  clearQueue,
  jumpTo,
  loadQueue,
  playTrack,
  removeFromQueue,
  reorderQueue,
  selectCurrentIndex,
  selectQueue,
  selectIsPlaying,
} from '../../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { formatDuration, formatRelativeTime, getDisplayName } from '../../utils/format';
import { showToast } from '../../utils/toast';
import TrackActionMenu from '../common/TrackActionMenu';
import AddToPlaylistModal from '../common/AddToPlaylistModal';
import ActivityItem from '../common/ActivityItem';
import ActivityFeedModal from '../common/ActivityFeedModal';
import { PlayingOverlay } from '../common/PulseAnimations';
import { describeActivity } from '../../utils/activity';

export default function RightPanel({
  isLargeDesktop = false,
  isMobile = false,
  isOpen = false,
  onClose,
}) {
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const queue = useSelector(selectQueue);
  const currentIndex = useSelector(selectCurrentIndex);
  const isPlaying = useSelector(selectIsPlaying);

  const { data: recentHistory = [] } = useGetRecentlyPlayedQuery();
  const { data: activityData = [] } = useGetActivityFeedQuery();

  const [activeQueueTab, setActiveQueueTab] = useState('queue');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null);
  const [playlistModalItem, setPlaylistModalItem] = useState(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDraggingOutside, setIsDraggingOutside] = useState(false);

  const queueContainerRef = useRef(null);
  const draggedIndexRef = useRef(null);
  const isDroppedInQueueRef = useRef(false);
  const cancelledRef = useRef(false);
  const lastDragCoordsRef = useRef({ x: 0, y: 0 });

  const showRightPanel = isLargeDesktop || isOpen;

  // Active items for current tab
  const displayItems = activeQueueTab === 'queue' ? queue : recentHistory;
  
  // Described activities for feed
  const describedActivities = useMemo(
    () => (Array.isArray(activityData) ? activityData.map(describeActivity).filter(Boolean) : []),
    [activityData]
  );
  // Show only 4 items in compact panel
  const compactActivities = describedActivities.slice(0, 4);

  const handleTrackClick = (track, index) => {
    if (activeQueueTab === 'queue') {
      dispatch(jumpTo(index));
    } else {
      dispatch(playTrack(track, recentHistory));
    }
  };

  const handleClearQueue = () => {
    dispatch(clearQueue());
  };

  const handleRemoveTrack = (index) => {
    const targetSong = queue[index];
    const songTitle = targetSong?.title || 'Song';
    dispatch(removeFromQueue(index));
    showToast(`Removed "${songTitle}" from queue`);
  };

  // Track dragging outside the component area across the window
  useEffect(() => {
    if (draggedIndex === null) {
      setIsDraggingOutside(false);
      return;
    }

    const handleWindowDragOver = (e) => {
      e.preventDefault();
      lastDragCoordsRef.current = { x: e.clientX, y: e.clientY };

      if (!queueContainerRef.current) return;
      const rect = queueContainerRef.current.getBoundingClientRect();
      const outside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;

      setIsDraggingOutside(outside);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        cancelledRef.current = true;
        setIsDraggingOutside(false);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [draggedIndex]);

  const handleDragStart = (e, index) => {
    if (activeQueueTab !== 'queue') return;
    draggedIndexRef.current = index;
    setDraggedIndex(index);
    isDroppedInQueueRef.current = false;
    cancelledRef.current = false;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    if (activeQueueTab !== 'queue' || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const position = offset < rect.height / 2 ? 'top' : 'bottom';

    if (dragOverIndex !== index || dragOverPosition !== position) {
      setDragOverIndex(index);
      setDragOverPosition(position);
    }
  };

  const handleDragLeave = (e, index) => {
    if (!e.currentTarget.contains(e.relatedTarget) && dragOverIndex === index) {
      setDragOverIndex(null);
      setDragOverPosition(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    if (activeQueueTab !== 'queue') return;
    e.preventDefault();
    isDroppedInQueueRef.current = true;
    const sourceIndex = draggedIndexRef.current ?? draggedIndex;
    setDraggedIndex(null);
    draggedIndexRef.current = null;
    setDragOverIndex(null);
    setDragOverPosition(null);
    setIsDraggingOutside(false);

    if (sourceIndex === null || sourceIndex === targetIndex) return;

    dispatch(reorderQueue({ sourceIndex, destinationIndex: targetIndex }));
  };

  const handleDragEnd = (e) => {
    const sourceIndex = draggedIndexRef.current ?? draggedIndex;
    const wasDroppedInQueue = isDroppedInQueueRef.current;
    const wasCancelled = cancelledRef.current;
    const outside = isDraggingOutside;

    isDroppedInQueueRef.current = false;
    cancelledRef.current = false;
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
    setIsDraggingOutside(false);

    if (sourceIndex === null || wasDroppedInQueue || wasCancelled) {
      return;
    }

    let isOutside = outside;
    if (!isOutside && queueContainerRef.current) {
      const rect = queueContainerRef.current.getBoundingClientRect();
      const x = e.clientX || lastDragCoordsRef.current.x;
      const y = e.clientY || lastDragCoordsRef.current.y;
      if (x !== 0 || y !== 0) {
        isOutside = x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
      }
    }

    if (isOutside) {
      handleRemoveTrack(sourceIndex);
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          ${isLargeDesktop ? 'relative' : 'fixed right-0 top-0 bottom-0 z-50'}
          ${showRightPanel ? 'translate-x-0' : 'translate-x-full'}
          w-85 shrink-0 bg-sidebar border-l border-brd flex flex-col overflow-hidden
          transition-transform duration-300 ease-out shadow-[[-10px_0_30px_rgba(0,0,0,0.02)]] dark:shadow-none
        `}
      >
        {/* Close button */}
        {!isLargeDesktop && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-card border border-brd flex items-center justify-center hover:bg-elevated transition-colors text-txt-muted shadow-sm cursor-pointer"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        )}

        {/* Playing Queue Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <Music2 size={20} style={{ color: accentTextColor }} />
            </div>
            <h3 className="text-xl font-space font-bold text-txt">
              {activeQueueTab === 'queue' ? 'Playing Queue' : 'Recently Played'}
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-brd pb-1">
            <button
              onClick={() => setActiveQueueTab('queue')}
              className="pb-2 text-sm font-bold transition-colors relative cursor-pointer"
              style={{ color: activeQueueTab === 'queue' ? accentColor : 'var(--text-muted)' }}
            >
              Queue
              {activeQueueTab === 'queue' && (
                <span
                  className="absolute -bottom-1.25 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveQueueTab('history')}
              className="pb-2 text-sm font-bold transition-colors relative cursor-pointer"
              style={{ color: activeQueueTab === 'history' ? accentColor : 'var(--text-muted)' }}
            >
              History
              {activeQueueTab === 'history' && (
                <span
                  className="absolute -bottom-1.25 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Track List */}
        <div
          ref={queueContainerRef}
          className={`flex-1 overflow-y-auto px-6 space-y-2 scrollbar-hide pb-4 relative transition-colors duration-200 ${
            isDraggingOutside ? 'ring-2 ring-red-500/40 ring-inset bg-red-500/5' : ''
          }`}
        >
          {/* Visual feedback banner when dragging outside the component area */}
          {isDraggingOutside && (
            <div className="sticky top-2 z-30 mx-auto w-fit px-4 py-2 rounded-full bg-red-500/90 text-white text-xs font-bold shadow-xl flex items-center gap-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <Trash2 size={14} />
              <span>Release outside to remove from queue</span>
            </div>
          )}

          {displayItems.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105"
                style={{
                  backgroundColor: `${accentColor}18`,
                  color: accentColor,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                {activeQueueTab === 'queue' ? (
                  <ListMusic size={28} />
                ) : (
                  <Music2 size={28} />
                )}
              </div>
              <h4 className="text-base font-space font-bold text-txt mb-1.5">
                {activeQueueTab === 'queue'
                  ? 'Your queue is empty'
                  : 'No listening history yet'}
              </h4>
              <p className="text-xs font-medium text-txt-muted max-w-[220px] leading-relaxed">
                {activeQueueTab === 'queue'
                  ? 'Add tracks or albums to your queue using the 3-dot menu or play any song to begin listening.'
                  : 'Songs you play will appear here so you can easily jump back to them.'}
              </p>
            </div>
          ) : (
            displayItems.map((song, i) => {
              const isCurrent = activeQueueTab === 'queue' && queue.length > 0 && currentIndex === i;
              const isDragged = activeQueueTab === 'queue' && draggedIndex === i;
              const isDragOver = activeQueueTab === 'queue' && dragOverIndex === i && draggedIndex !== null && draggedIndex !== i;
              const songTitle = song.title || 'Untitled';
              const songArtist = getDisplayName(song.artist, song.artistName || 'Artist');
              const songCover = song.coverImage || (song.img ? `https://picsum.photos/seed/${song.img}/80/80` : `https://picsum.photos/seed/${i}/80/80`);
              const durationFormatted = song.duration ? formatDuration(song.duration) : (song.time || '3:30');

              return (
                <div
                  key={song._id || i}
                  draggable={activeQueueTab === 'queue'}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragLeave={(e) => handleDragLeave(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleTrackClick(song, i)}
                  className={`flex items-center gap-4 py-3 px-3 -mx-3 rounded-2xl cursor-pointer group transition-all relative select-none ${
                    isCurrent ? 'bg-elevated/80' : 'hover:bg-elevated'
                  } ${
                    isDragged ? 'opacity-40 scale-[0.98] border border-dashed border-primary/50' : ''
                  }`}
                >
                  {/* Drop position indicator */}
                  {isDragOver && (
                    <div
                      className={`absolute left-2 right-2 h-0.5 rounded-full z-30 pointer-events-none transition-all ${
                        dragOverPosition === 'top' ? '-top-1' : '-bottom-1'
                      }`}
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 0 8px ${accentColor}`,
                      }}
                    />
                  )}

                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm bg-elevated">
                    <img
                      src={songCover}
                      className="w-full h-full object-cover pointer-events-none"
                      alt={songTitle}
                    />
                    {isCurrent && (
                      isPlaying ? (
                        <PlayingOverlay size={20} rounded="rounded-xl" color={accentColor} />
                      ) : (
                        <div
                          className="absolute inset-0 bg-black/40 flex items-center justify-center"
                          style={{ color: accentColor }}
                        >
                          <Play size={16} fill="currentColor" />
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <p
                      className="text-sm font-bold truncate transition-colors"
                      style={{ color: isCurrent ? accentColor : 'inherit' }}
                    >
                      {songTitle}
                    </p>
                    <p className="text-[11px] font-medium text-txt-muted truncate">
                      {songArtist}
                    </p>
                  </div>

                  {/* Duration (shown when not hovered) */}
                  <span className="text-[11px] font-space font-medium text-txt-muted opacity-80 group-hover:opacity-0 transition-opacity shrink-0 mr-1">
                    {durationFormatted}
                  </span>

                  {/* Hover action buttons: delete button, 3-dot menu and drag handle */}
                  <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {/* Delete button (for queue items) */}
                    {activeQueueTab === 'queue' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTrack(i);
                        }}
                        className="p-1 rounded-lg text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove from queue"
                        aria-label="Remove from queue"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <TrackActionMenu
                      item={song}
                      itemType="track"
                      buttonSize={26}
                      iconSize={14}
                      direction="horizontal"
                      align="right"
                      onOpenPlaylistModal={(track) => setPlaylistModalItem(track)}
                      triggerClassName="text-txt-muted hover:text-txt hover:bg-sidebar/80 rounded-lg p-1"
                    />

                    {activeQueueTab === 'queue' && (
                      <div
                        className="flex items-center justify-center p-1 rounded-lg text-txt-muted hover:text-txt cursor-grab active:cursor-grabbing transition-colors hover:bg-sidebar/80 shrink-0"
                        title="Drag to reorder / drag outside to remove"
                        aria-label="Drag to reorder"
                        style={{ cursor: 'grab' }}
                      >
                        <GripVertical size={14} className="pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Queue Footer */}
        {activeQueueTab === 'queue' && queue.length > 0 && (
          <div className="px-8 py-5 border-t border-brd flex items-center justify-between">
            <button
              onClick={handleClearQueue}
              className="flex items-center gap-2 text-xs font-bold text-txt-muted hover:text-txt transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Clear Queue
            </button>
            <span className="text-xs font-space font-bold text-txt-muted">
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
        )}

        {/* Friend Activity Feed */}
        <div className="border-t border-brd bg-bg">
          <div className="flex items-center justify-between px-8 pt-6 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-space font-bold text-txt">Friend Activity</h3>
              {describedActivities.length > 0 && (
                <span className="text-[10px] font-space font-bold px-2 py-0.5 rounded-full bg-elevated border border-brd text-txt-muted">
                  {describedActivities.length}
                </span>
              )}
            </div>
            {describedActivities.length > 0 && (
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(true)}
                className="text-[11px] font-space font-bold cursor-pointer hover:underline transition-all"
                style={{ color: accentColor }}
              >
                View all
              </button>
            )}
          </div>
          <div className="px-8 pb-6 space-y-2 overflow-y-auto max-h-[340px] scrollbar-hide">
            {compactActivities.length === 0 ? (
              <div className="py-8 text-center text-txt-muted">
                <p className="text-xs font-medium">No recent activity</p>
                <p className="text-[10px] text-txt-muted/70 mt-1">Likes, releases, and playlist updates will show up here.</p>
              </div>
            ) : (
              compactActivities.map((info) => (
                <ActivityItem
                  key={info.id}
                  info={info}
                  variant="compact"
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── Activity Feed Modal ── */}
      <ActivityFeedModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      />

      {/* ── Add to Playlist Modal ── */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalItem)}
        onClose={() => setPlaylistModalItem(null)}
        item={playlistModalItem}
        itemType="track"
      />
    </>
  );
}

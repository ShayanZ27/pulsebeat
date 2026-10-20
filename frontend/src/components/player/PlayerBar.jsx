import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronDown,
  Heart,
  ListMusic,
  Maximize2,
  Mic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { seek } from '../../audio/audioElement';
import { useAudioProgress } from '../../audio/useAudioProgress';
import {
  cycleRepeat,
  nextTrack,
  prevTrack,
  selectCurrentTrack,
  selectIsMuted,
  selectIsPlaying,
  selectIsShuffle,
  selectRepeatMode,
  selectVolume,
  setFullScreen,
  setVolume,
  toggleMute,
  togglePlay,
  toggleShuffleMode,
} from '../../store/playerSlice';
import {
  selectAccentColor,
  selectAccentTextColor,
} from '../../store/themeSlice';
import { formatDuration, getDisplayName } from '../../utils/format';
import { useAddLikeMutation, useGetLikedMusicQuery, useRemoveLikeMutation } from '../../store/api';
import { showToast } from '../../utils/toast';
import TrackActionMenu from '../common/TrackActionMenu';
import AddToPlaylistModal from '../common/AddToPlaylistModal';
import { PlayingHeartbeat } from '../common/PulseAnimations';

/**
 * Isolated progress bar component.
 * Only this component re-renders on ~4 Hz audio playback ticks,
 * preventing PlayerBar and the rest of the app from unnecessary renders.
 */
function ProgressBar({ accentColor }) {
  const { currentTime, duration } = useAudioProgress();
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (duration > 0) {
      seek(Math.max(0, Math.min(pos * duration, duration)));
    }
  };

  return (
    <div className="flex items-center gap-4 w-full max-w-xl group">
      <span className="text-[11px] font-space font-bold text-txt-muted w-10 text-right">
        {formatDuration(currentTime)}
      </span>
      <div
        onClick={handleSeek}
        className="h-1.5 flex-1 bg-elevated rounded-full cursor-pointer relative overflow-hidden group-hover:h-2 transition-all"
        role="slider"
        aria-label="Seek track position"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-colors"
          style={{ backgroundColor: accentColor, width: `${progressPercent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border-2 border-bg"
          style={{
            backgroundColor: accentColor,
            left: `${progressPercent}%`,
            marginLeft: '-8px',
          }}
        />
      </div>
      <span className="text-[11px] font-space font-bold text-txt-muted w-10">
        {formatDuration(duration)}
      </span>
    </div>
  );
}

export default function PlayerBar({ onToggleRightPanel }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);

  const [addLike] = useAddLikeMutation();
  const [removeLike] = useRemoveLikeMutation();

  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);
  const volume = useSelector(selectVolume);
  const isMuted = useSelector(selectIsMuted);
  const repeatMode = useSelector(selectRepeatMode);
  const isShuffle = useSelector(selectIsShuffle);

  const { data: likedMusic = [] } = useGetLikedMusicQuery(undefined, {
    skip: !currentTrack?._id,
  });

  const isCurrentTrackLiked = currentTrack?._id
    ? likedMusic.some((l) => String(l.targetId?._id || l.targetId?.id || l.targetId) === String(currentTrack._id))
    : false;

  const handleToggleCurrentLike = async (e) => {
    e.stopPropagation();
    if (!currentTrack?._id) return;
    const title = currentTrack.title || 'Song';
    try {
      if (isCurrentTrackLiked) {
        await removeLike({ id: currentTrack._id, targetType: 'music' }).unwrap();
        showToast(`Removed "${title}" from Liked Songs`);
      } else {
        await addLike({ id: currentTrack._id, targetType: 'music' }).unwrap();
        showToast(`Added "${title}" to Liked Songs`);
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Could not update library';
      showToast(msg, 'error');
    }
  };

  const displayTitle = currentTrack?.title || 'No track selected';
  const displayArtist = currentTrack
    ? getDisplayName(currentTrack.artist, currentTrack.artistName || 'Artist')
    : 'Select a track to play';
  const displayCover = currentTrack?.coverImage || null;
  const artistId =
    currentTrack?.artist?._id ||
    currentTrack?.artist?.id ||
    (typeof currentTrack?.artist === 'string' ? currentTrack.artist : null) ||
    currentTrack?.artistId;

  const handleVolumeBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newVol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    dispatch(setVolume(newVol));
  };

  const currentVolumePercent = isMuted ? 0 : volume * 100;

  return (
    <footer className="h-[96px] bg-sidebar border-t border-brd flex items-center px-6 md:px-10 z-30 flex-shrink-0 relative shadow-[0_-5px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
      {/* Left: Now Playing */}
      <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
        <div
          onClick={() => currentTrack && dispatch(setFullScreen(true))}
          className={`w-16 h-16 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 hidden sm:flex items-center justify-center border border-brd bg-card text-txt-muted/50 relative group ${
            currentTrack ? 'cursor-pointer' : ''
          }`}
          title={currentTrack ? 'Open full screen player' : undefined}
        >
          {displayCover ? (
            <img
              src={displayCover}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <Music2 size={24} />
          )}
          {currentTrack && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
              <Maximize2 size={20} className="text-white drop-shadow-md" />
            </div>
          )}
          {currentTrack && isPlaying && (
            <div className="absolute bottom-1 right-1 p-1 rounded-full bg-black/65 backdrop-blur-md shadow-md border border-white/10 group-hover:opacity-0 transition-opacity flex items-center justify-center">
              <PlayingHeartbeat size={13} color={accentColor} />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0 pr-4">
          <span
            onClick={() => currentTrack && dispatch(setFullScreen(true))}
            className="text-[15px] font-bold text-txt truncate hover:underline cursor-pointer mb-0.5 leading-normal pb-0.5"
            title={currentTrack ? 'Open full screen player' : undefined}
          >
            {displayTitle}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (artistId) {
                navigate(`/artist/${artistId}`);
              }
            }}
            className={`text-[11px] font-medium text-txt-muted truncate leading-normal pb-0.5 ${
              artistId ? 'hover:underline cursor-pointer hover:text-txt' : ''
            }`}
            title={artistId ? `Go to ${displayArtist}` : undefined}
          >
            {displayArtist}
          </span>
        </div>
        {currentTrack && (
          <>
            <button
              onClick={handleToggleCurrentLike}
              className="p-2 hidden sm:block cursor-pointer transition-colors"
              style={{ color: isCurrentTrackLiked ? accentColor : undefined }}
              title={isCurrentTrackLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              aria-label={isCurrentTrackLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            >
              <Heart
                size={20}
                fill={isCurrentTrackLiked ? accentColor : 'none'}
                className={isCurrentTrackLiked ? '' : 'text-txt-muted hover:text-txt'}
              />
            </button>

            <TrackActionMenu
              item={currentTrack}
              itemType="track"
              buttonSize={32}
              iconSize={18}
              direction="horizontal"
              align="left"
              onOpenPlaylistModal={(track) => setPlaylistModalTrack(track)}
              triggerClassName="text-txt-muted hover:text-txt transition-colors p-1.5 hidden sm:flex"
            />
          </>
        )}
      </div>

      {/* Center: Controls + Progress */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-[700px] mx-auto gap-2">
        <div className="flex items-center gap-6">
          {/* Shuffle Button */}
          <button
            onClick={() => dispatch(toggleShuffleMode())}
            className={`transition-colors p-2 hidden sm:block ${
              isShuffle ? 'text-primary' : 'text-txt-muted hover:text-primary'
            }`}
            style={{ color: isShuffle ? accentColor : undefined }}
            title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
            aria-label="Toggle shuffle"
          >
            <Shuffle size={18} />
          </button>

          {/* Previous Track */}
          <button
            onClick={() => dispatch(prevTrack())}
            className="text-txt-sec hover:text-primary transition-colors p-2"
            title="Previous track"
            aria-label="Previous track"
          >
            <SkipBack size={22} fill="currentColor" />
          </button>

          {/* Play / Pause Button */}
          <button
            onClick={() => dispatch(togglePlay())}
            className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: accentColor, color: accentTextColor }}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} fill={accentTextColor} />
            ) : (
              <Play size={20} fill={accentTextColor} className="ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={() => dispatch(nextTrack())}
            className="text-txt-sec hover:text-primary transition-colors p-2"
            title="Next track"
            aria-label="Next track"
          >
            <SkipForward size={22} fill="currentColor" />
          </button>

          {/* Repeat Button */}
          <button
            onClick={() => dispatch(cycleRepeat())}
            className={`transition-colors p-2 hidden sm:block relative ${
              repeatMode !== 'off' ? 'text-primary' : 'text-txt-muted hover:text-primary'
            }`}
            style={{ color: repeatMode !== 'off' ? accentColor : undefined }}
            title={`Repeat mode: ${repeatMode}`}
            aria-label="Cycle repeat mode"
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Progress Bar with isolated high-frequency ticks */}
        <ProgressBar accentColor={accentColor} />
      </div>

      {/* Right: Volume & Extras */}
      <div className="flex items-center justify-end w-1/3 gap-3 text-txt-muted pl-4">
        <button
          onClick={() => showToast('Lyrics not available', 'info')}
          className="hover:text-primary transition-colors p-2 hidden lg:block cursor-pointer"
          title="Lyrics"
          aria-label="Lyrics"
        >
          <Mic size={18} />
        </button>

        <button
          onClick={onToggleRightPanel}
          className="hover:text-primary transition-colors p-2 hidden md:block"
          title="Queue"
          aria-label="Queue"
        >
          <ListMusic size={18} />
        </button>

        <div className="hidden sm:flex items-center gap-2 w-28 group cursor-pointer px-2">
          <button
            onClick={() => dispatch(toggleMute())}
            className="text-txt-muted hover:text-primary transition-colors flex-shrink-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div
            onClick={handleVolumeBarClick}
            className="h-1.5 flex-1 bg-elevated rounded-full relative overflow-hidden group-hover:h-2 transition-all cursor-pointer"
            role="slider"
            aria-label="Volume slider"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={isMuted ? 0 : volume}
          >
            <div
              className="h-full rounded-full transition-colors"
              style={{ backgroundColor: accentColor, width: `${currentVolumePercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => currentTrack && dispatch(setFullScreen(true))}
          disabled={!currentTrack}
          className="hover:text-primary transition-colors p-2 hidden md:block cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Full screen"
          aria-label="Full screen"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      {/* ── Add to Playlist Modal ── */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalTrack)}
        onClose={() => setPlaylistModalTrack(null)}
        item={playlistModalTrack}
        itemType="track"
      />
    </footer>
  );
}

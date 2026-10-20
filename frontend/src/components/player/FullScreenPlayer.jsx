import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronDown,
  Disc3,
  Heart,
  ListMusic,
  Maximize2,
  Mic,
  Minimize2,
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
  X,
} from 'lucide-react';
import { seek } from '../../audio/audioElement';
import { useAudioProgress } from '../../audio/useAudioProgress';
import {
  cycleRepeat,
  nextTrack,
  prevTrack,
  selectCurrentIndex,
  selectCurrentTrack,
  selectIsFullScreen,
  selectIsMuted,
  selectIsPlaying,
  selectIsShuffle,
  selectQueue,
  selectRepeatMode,
  selectVolume,
  setFullScreen,
  setVolume,
  toggleMute,
  togglePlay,
  toggleShuffleMode,
  jumpTo,
} from '../../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { formatTime, getDisplayName } from '../../utils/format';
import { useAddLikeMutation, useGetLikedMusicQuery, useRemoveLikeMutation } from '../../store/api';
import { showToast } from '../../utils/toast';
import TrackActionMenu from '../common/TrackActionMenu';
import AddToPlaylistModal from '../common/AddToPlaylistModal';
import { PlayingHeartbeat } from '../common/PulseAnimations';
import { LogoPulseSVG } from '../icons/LineArt';

/**
 * High-frequency scrubber progress component for full screen view.
 * Kept isolated to ensure ~4Hz ticks only re-render this bar.
 */
function FullScreenProgressBar({ accentColor }) {
  const { currentTime, duration } = useAudioProgress();
  const [hoverPercent, setHoverPercent] = useState(null);
  const barRef = useRef(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pos * duration);
  };

  const handleMouseMove = (e) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPercent(pos * 100);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col gap-2 mx-auto px-4 select-none">
      <div
        ref={barRef}
        onClick={handleSeek}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPercent(null)}
        className="group relative h-3 flex items-center cursor-pointer py-1"
        role="slider"
        aria-label="Seek track position"
        aria-valuemin={0}
        aria-valuemax={duration || 100}
        aria-valuenow={currentTime}
      >
        {/* Track groove */}
        <div className="w-full h-1.5 group-hover:h-2 bg-white/20 rounded-full overflow-hidden transition-all relative">
          {/* Buffered / Hover preview line */}
          {hoverPercent !== null && (
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full pointer-events-none transition-all"
              style={{ width: `${hoverPercent}%` }}
            />
          )}

          {/* Active playback progress */}
          <div
            className="h-full rounded-full transition-all relative"
            style={{
              backgroundColor: accentColor,
              width: `${progressPercent}%`,
              boxShadow: `0 0 12px ${accentColor}`,
            }}
          />
        </div>

        {/* Thumb indicator on hover */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            left: `${progressPercent}%`,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />

        {/* Hover timestamp tooltip */}
        {hoverPercent !== null && duration > 0 && (
          <div
            className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-[11px] font-space text-white shadow-md pointer-events-none"
            style={{ left: `${hoverPercent}%` }}
          >
            {formatTime((hoverPercent / 100) * duration)}
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="flex items-center justify-between text-xs font-space text-white/60 tracking-wider">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

/**
 * Animated PulseBeat ECG Heartbeat rhythm line.
 */
function PulseWaveform({ isPlaying, accentColor }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 select-none pointer-events-none">
      <svg
        viewBox="0 0 400 40"
        className="w-full max-w-sm h-8 opacity-80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 20 H120 L130 10 L140 32 L150 4 L160 36 L170 18 L180 20 H400"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isPlaying ? 'animate-pulse' : 'opacity-40'}
          style={{
            filter: isPlaying ? `drop-shadow(0 0 8px ${accentColor})` : 'none',
            strokeDasharray: isPlaying ? '300' : 'none',
            animation: isPlaying ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          }}
        />
      </svg>
    </div>
  );
}

export default function FullScreenPlayer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector(selectIsFullScreen);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);
  const isShuffle = useSelector(selectIsShuffle);
  const repeatMode = useSelector(selectRepeatMode);
  const volume = useSelector(selectVolume);
  const isMuted = useSelector(selectIsMuted);
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const queue = useSelector(selectQueue);
  const currentIndex = useSelector(selectCurrentIndex);

  const [showControls, setShowControls] = useState(true);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);

  const { data: likedMusic = [] } = useGetLikedMusicQuery(undefined, {
    skip: !currentTrack?._id,
  });
  const [addLike] = useAddLikeMutation();
  const [removeLike] = useRemoveLikeMutation();

  const isLiked = currentTrack?._id
    ? likedMusic.some((l) => String(l.targetId?._id || l.targetId?.id || l.targetId) === String(currentTrack._id))
    : false;

  const inactivityTimerRef = useRef(null);

  // Monitor native fullscreen state changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Cinema Mode: auto-hide controls on mouse inactivity
  const resetInactivityTimer = () => {
    setShowControls(true);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (isPlaying && !showQueueDrawer) {
      inactivityTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isOpen, isPlaying, showQueueDrawer]);

  // Global keyboard shortcuts when full screen is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Ignore if typing inside an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        dispatch(setFullScreen(false));
      } else if (e.code === 'Space') {
        e.preventDefault();
        dispatch(togglePlay());
        resetInactivityTimer();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch(nextTrack());
        resetInactivityTimer();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatch(prevTrack());
        resetInactivityTimer();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        dispatch(toggleMute());
        resetInactivityTimer();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleNativeFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser permissions or user gesture fallback
    }
  };

  const handleToggleLike = async (e) => {
    if (e) e.stopPropagation();
    if (!currentTrack?._id) return;
    const title = currentTrack.title || 'Song';
    try {
      if (isLiked) {
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

  const handleVolumeBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newVol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    dispatch(setVolume(newVol));
    resetInactivityTimer();
  };

  const currentVolumePercent = isMuted ? 0 : volume * 100;

  const displayTitle = currentTrack?.title || 'No track selected';
  const displayArtist = currentTrack
    ? getDisplayName(currentTrack.artist, currentTrack.artistName || 'Artist')
    : 'Select a track to start the pulse';
  const displayCover = currentTrack?.coverImage || null;
  const artistId =
    currentTrack?.artist?._id ||
    currentTrack?.artist?.id ||
    (typeof currentTrack?.artist === 'string' ? currentTrack.artist : null) ||
    currentTrack?.artistId;

  const upcomingQueue = queue.slice(currentIndex + 1, currentIndex + 6);

  return (
    <div
      onMouseMove={resetInactivityTimer}
      onClick={resetInactivityTimer}
      className={`fixed inset-0 z-50 bg-[#07080b] text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300 ${
        !showControls && isPlaying ? 'cursor-none' : ''
      }`}
    >
      {/* ── Layer 1: Ambient Blurred Backdrop ── */}
      {displayCover ? (
        <div
          className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] bg-cover bg-center pointer-events-none blur-[110px] opacity-35 saturate-200 transition-all duration-1000 transform scale-105"
          style={{ backgroundImage: `url(${displayCover})` }}
        />
      ) : (
        <div
          className="absolute inset-0 pointer-events-none opacity-20 blur-[120px]"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${accentColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Layer 2: Vignette Gradient & Mesh Overlay */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_40%] from-transparent via-[#07080b]/60 to-[#07080b] pointer-events-none" />

      {/* ── Top Bar / Header ── */}
      <header
        className={`relative z-20 flex items-center justify-between px-6 sm:px-10 py-6 transition-all duration-500 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {/* Left: Brandmark & Now Playing Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md">
            <LogoPulseSVG color={accentColor} size={22} />
            <span className="text-sm font-playfair font-black tracking-tight text-white">PulseBeat</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-[11px] font-space font-bold uppercase tracking-widest text-white/70">
              Now Playing
            </span>
            {isPlaying && <PlayingHeartbeat size={12} color={accentColor} />}
          </div>
        </div>

        {/* Right: Actions & Minimize */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Keyboard shortcut hint */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-space text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/90">Space</kbd> Play</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/90">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/90">→</kbd> Tracks</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/90">Esc</kbd> Exit</span>
          </div>

          {/* Queue Drawer Button */}
          <button
            onClick={() => setShowQueueDrawer((prev) => !prev)}
            className={`p-2.5 rounded-full border border-white/10 backdrop-blur-md transition-all cursor-pointer ${
              showQueueDrawer ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Queue"
            aria-label="Toggle queue peek"
          >
            <ListMusic size={20} />
          </button>

          {/* Native Browser Fullscreen */}
          <button
            onClick={toggleNativeFullscreen}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white backdrop-blur-md transition-all cursor-pointer"
            title={isNativeFullscreen ? 'Exit browser fullscreen (F)' : 'Enter browser fullscreen (F)'}
            aria-label="Toggle browser fullscreen"
          >
            {isNativeFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          {/* Close Full Screen View */}
          <button
            onClick={() => dispatch(setFullScreen(false))}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Exit full screen (Esc)"
            aria-label="Exit full screen"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </header>

      {/* ── Main Centerpiece: Artwork, Waveform & Track Details ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4 max-w-4xl mx-auto w-full">
        {/* Cover Art Stage with Peeking Vinyl */}
        <div className="relative flex items-center justify-center my-auto group">
          {/* Rotating Vinyl Record peeking out when playing */}
          <div
            className={`absolute top-2 -right-8 sm:-right-12 md:-right-16 w-52 h-52 sm:w-68 sm:h-68 md:w-80 md:h-80 rounded-full bg-linear-to-tr from-black via-[#141418] to-black border-4 border-stone-800/80 shadow-2xl flex items-center justify-center pointer-events-none transition-all duration-700 ${
              isPlaying
                ? 'opacity-90 translate-x-4 sm:translate-x-8 md:translate-x-12 animate-[spin_12s_linear_infinite]'
                : 'opacity-0 translate-x-0'
            }`}
          >
            {/* Vinyl grooves */}
            <div className="w-[82%] h-[82%] rounded-full border border-stone-700/30 flex items-center justify-center">
              <div className="w-[64%] h-[64%] rounded-full border border-stone-700/40 flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-stone-900"
                  style={{ backgroundColor: accentColor }}
                >
                  <div className="w-4 h-4 rounded-full bg-[#07080b] border border-white/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Cover Card */}
          <div
            className="relative z-10 w-60 h-60 sm:w-76 sm:h-76 md:w-92 md:h-92 lg:w-98 lg:h-98 rounded-3xl overflow-hidden border border-white/15 bg-black/40 flex items-center justify-center transition-all duration-500 shadow-[0_25px_80px_rgba(0,0,0,0.85)]"
            style={{
              boxShadow: isPlaying
                ? `0 0 70px -10px ${accentColor}80, 0 30px 90px rgba(0,0,0,0.85)`
                : '0 25px 80px rgba(0,0,0,0.85)',
            }}
          >
            {displayCover ? (
              <img
                src={displayCover}
                alt={displayTitle}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/30">
                <Music2 size={64} />
                <span className="text-sm font-space">PulseBeat Player</span>
              </div>
            )}
          </div>
        </div>

        {/* Track Metadata & Actions */}
        <div className="relative z-10 w-full flex flex-col items-center text-center mt-6">
          <div className="flex items-center justify-center gap-3 max-w-full px-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-playfair font-black text-white tracking-tight drop-shadow-md truncate pb-2 leading-normal">
              {displayTitle}
            </h1>
            {currentTrack && (
              <button
                onClick={handleToggleLike}
                className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                style={{ color: isLiked ? accentColor : undefined }}
                title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              >
                <Heart size={26} fill={isLiked ? accentColor : 'none'} className="transition-transform active:scale-125" />
              </button>
            )}
          </div>

          <p
            onClick={() => {
              if (artistId) {
                dispatch(setFullScreen(false));
                navigate(`/artist/${artistId}`);
              }
            }}
            className={`text-base sm:text-xl font-inter font-medium text-white/70 transition-colors mt-1 truncate max-w-xl ${
              artistId ? 'hover:underline cursor-pointer hover:text-white' : ''
            }`}
            title={artistId ? `Go to ${displayArtist}` : undefined}
          >
            {displayArtist}
          </p>

          {/* PulseBeat Heartbeat ECG Visualizer */}
          <PulseWaveform isPlaying={isPlaying} accentColor={accentColor} />
        </div>
      </main>

      {/* ── Bottom Controls & Scrubber ── */}
      <footer
        className={`relative z-20 w-full max-w-4xl mx-auto px-6 sm:px-10 pb-8 pt-2 flex flex-col items-center gap-5 transition-all duration-500 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Scrubber progress */}
        <FullScreenProgressBar accentColor={accentColor} />

        {/* Playback Controls & Volume */}
        <div className="w-full flex items-center justify-between">
          {/* Left Extra: Playlist menu & Lyrics */}
          <div className="flex items-center gap-3 w-1/4">
            {currentTrack && (
              <TrackActionMenu
                item={currentTrack}
                itemType="track"
                buttonSize={36}
                iconSize={18}
                direction="horizontal"
                align="left"
                onOpenPlaylistModal={(track) => setPlaylistModalTrack(track)}
                triggerClassName="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              />
            )}
            <button
              onClick={() => showToast('Lyrics not available', 'info')}
              className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer hidden sm:block"
              title="Lyrics"
              aria-label="Lyrics"
            >
              <Mic size={20} />
            </button>
          </div>

          {/* Center: Main Playback Controls */}
          <div className="flex items-center gap-5 sm:gap-7">
            {/* Shuffle */}
            <button
              onClick={() => dispatch(toggleShuffleMode())}
              className={`p-2 transition-colors cursor-pointer rounded-full hover:bg-white/10 relative ${
                isShuffle ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
              style={{ color: isShuffle ? accentColor : undefined }}
              title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
            >
              <Shuffle size={20} />
              {isShuffle && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>

            {/* Skip Previous */}
            <button
              onClick={() => dispatch(prevTrack())}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer"
              title="Previous (←)"
            >
              <SkipBack size={26} fill="currentColor" />
            </button>

            {/* Play / Pause Giant Center Button */}
            <button
              onClick={() => dispatch(togglePlay())}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_10px_35px_rgba(0,0,0,0.6)] cursor-pointer"
              style={{
                backgroundColor: accentColor,
                color: accentTextColor,
                boxShadow: `0 0 30px ${accentColor}60, 0 10px 30px rgba(0,0,0,0.6)`,
              }}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause size={28} fill={accentTextColor} />
              ) : (
                <Play size={28} fill={accentTextColor} className="ml-1" />
              )}
            </button>

            {/* Skip Next */}
            <button
              onClick={() => dispatch(nextTrack())}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer"
              title="Next (→)"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={() => dispatch(cycleRepeat())}
              className={`p-2 transition-colors cursor-pointer rounded-full hover:bg-white/10 relative ${
                repeatMode !== 'off' ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
              style={{ color: repeatMode !== 'off' ? accentColor : undefined }}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
              {repeatMode !== 'off' && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          </div>

          {/* Right Extra: Volume Slider */}
          <div className="flex items-center justify-end gap-2 w-1/4">
            <div className="hidden sm:flex items-center gap-2 group cursor-pointer px-2">
              <button
                onClick={() => dispatch(toggleMute())}
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div
                onClick={handleVolumeBarClick}
                className="w-20 md:w-24 h-1.5 bg-white/20 rounded-full relative overflow-hidden group-hover:h-2 transition-all cursor-pointer"
                role="slider"
                aria-label="Volume slider"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={isMuted ? 0 : volume}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ backgroundColor: accentColor, width: `${currentVolumePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Slide-Over Upcoming Queue Drawer ── */}
      {showQueueDrawer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 top-24 bottom-28 w-80 max-w-[calc(100vw-3rem)] bg-black/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 z-40 shadow-2xl flex flex-col animate-in fade-in slide-in-from-right-6 duration-300"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <ListMusic size={18} style={{ color: accentColor }} />
              <span className="text-sm font-space font-bold uppercase tracking-wider text-white">Up Next</span>
            </div>
            <button
              onClick={() => setShowQueueDrawer(false)}
              className="text-white/60 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {upcomingQueue.length === 0 ? (
              <div className="text-center py-8 text-white/50 text-xs font-space">
                End of queue. Play more tracks from Home or Library!
              </div>
            ) : (
              upcomingQueue.map((song, i) => (
                <div
                  key={song._id || i}
                  onClick={() => dispatch(jumpTo(currentIndex + 1 + i))}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <img
                    src={song.coverImage || 'https://picsum.photos/seed/track/60/60'}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                      {song.title}
                    </p>
                    <p className="text-[11px] text-white/60 truncate">
                      {getDisplayName(song.artist, song.artistName || 'Artist')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Add to Playlist Modal inside Fullscreen ── */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalTrack)}
        onClose={() => setPlaylistModalTrack(null)}
        item={playlistModalTrack}
        itemType="track"
      />
    </div>
  );
}

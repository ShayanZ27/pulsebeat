import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import TrackActionMenu from './TrackActionMenu';
import { PlayingHeartbeat } from './PulseAnimations';
import { selectCurrentTrack, selectIsPlaying } from '../../store/playerSlice';
import { getDisplayName } from '../../utils/format';

const SLIDE_DURATION_MS = 6000;

const TYPE_LABEL = { album: 'Album', track: 'Track', playlist: 'Playlist' };

function slideMeta({ type, item }) {
  const isPlaylist = type === 'playlist';
  return {
    label: TYPE_LABEL[type] || 'Album',
    title: (isPlaylist ? item.name : item.title) || 'Untitled',
    subtitle: isPlaylist
      ? `by ${getDisplayName(item.owner, 'PulseBeat')}`
      : getDisplayName(item.artist, item.artistName || 'Artist'),
    cover: item.coverImage || `https://picsum.photos/seed/${item._id || type}/500/400`,
  };
}

/** True when the current track belongs to this slide's content. */
function isSlidePlaying({ type, item }, currentTrack, isPlaying) {
  if (!isPlaying || !currentTrack?._id) return false;
  if (type === 'track') return String(item._id) === String(currentTrack._id);
  return (item.songs || []).some((s) => String(s?._id || s) === String(currentTrack._id));
}

/**
 * Hero showcase carousel. Same card as the original "Featured Album" tile,
 * cycling through admin-pinned / trending albums, tracks and playlists.
 * Features directional sliding transitions, prominent Left/Right navigation,
 * and high-contrast progress pills.
 */
export default function FeaturedShowcase({
  slides,
  accentColor,
  onPlay,
  onOpen,
  onOpenPlaylistModal,
  onArtistClick,
}) {
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'
  const [isPaused, setIsPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => {
      setPrevIndex(null);
    }, 450);
    return () => clearTimeout(t);
  }, [index, prevIndex]);

  if (!slides?.length) return null;

  const count = slides.length;

  const goTo = (targetIndex, dir) => {
    if (targetIndex === index) return;
    const computedDir = dir || (targetIndex > index ? 'next' : 'prev');
    setPrevIndex(index);
    setDirection(computedDir);
    setIndex(targetIndex);
    setTimerKey((k) => k + 1);
  };

  const goNext = () => {
    goTo((index + 1) % count, 'next');
  };

  const goPrev = () => {
    goTo((index - 1 + count) % count, 'prev');
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="flex-1 max-w-[420px] w-full h-[340px] min-h-[340px] max-h-[340px] bg-sidebar border border-brd rounded-[32px] overflow-hidden relative group hover:shadow-xl transition-shadow duration-300 grid select-none"
    >
      {/* Left Navigation Arrow */}
      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer hover:border-white/40 hover:scale-105 group/nav"
        >
          <ChevronLeft size={20} className="transition-transform group-hover/nav:-translate-x-0.5" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer hover:border-white/40 hover:scale-105 group/nav"
        >
          <ChevronRight size={20} className="transition-transform group-hover/nav:translate-x-0.5" />
        </button>
      )}

      {/* Sliding Cards */}
      {slides.map((slide, i) => {
        const isIncoming = i === index;
        const isOutgoing = i === prevIndex;
        if (!isIncoming && !isOutgoing) return null;

        const { label, title, subtitle, cover } = slideMeta(slide);
        const playing = isSlidePlaying(slide, currentTrack, isPlaying);
        const artistId =
          slide.item.artist?._id ||
          (typeof slide.item.artist === 'string' && !slide.item.artist.startsWith('sample-')
            ? slide.item.artist
            : null);

        let transitionClass = '';
        if (prevIndex !== null) {
          if (isIncoming) {
            transitionClass = direction === 'next' ? 'pb-slide-in-right' : 'pb-slide-in-left';
          } else if (isOutgoing) {
            transitionClass =
              (direction === 'next' ? 'pb-slide-out-left' : 'pb-slide-out-right') +
              ' pointer-events-none';
          }
        }

        return (
          <div
            key={`${slide.type}-${slide.item._id || i}-${isIncoming ? 'in' : 'out'}`}
            onClick={() => onOpen(slide)}
            aria-hidden={!isIncoming}
            className={`[grid-area:1/1] h-full relative cursor-pointer ${transitionClass}`}
          >
            {isIncoming && (
              <div
                className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <TrackActionMenu
                  item={slide.item}
                  itemType={slide.type}
                  onOpenPlaylistModal={(item) => onOpenPlaylistModal(item, slide.type)}
                  triggerClassName="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md"
                />
              </div>
            )}

            <div className="relative z-10 pl-14 pr-12 pt-8 pb-14 flex flex-col justify-center h-full">
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} style={{ color: accentColor }} fill={accentColor} />
                <p
                  className="text-[10px] uppercase font-space font-bold tracking-widest"
                  style={{ color: accentColor }}
                >
                  Featured {label}
                </p>
                {playing && <PlayingHeartbeat size={14} color={accentColor} />}
              </div>
              <div className="h-20 flex items-center mb-1">
                <h2 className="text-3xl md:text-4xl font-space font-black text-txt line-clamp-2 leading-tight pb-1 max-w-[80%]">
                  {title}
                </h2>
              </div>
              <p
                onClick={(e) => {
                  if (artistId && onArtistClick) {
                    e.stopPropagation();
                    onArtistClick(artistId);
                  }
                }}
                className={`text-base font-medium text-txt-sec mb-6 truncate max-w-[70%] ${
                  artistId && onArtistClick ? 'hover:underline hover:text-txt cursor-pointer' : ''
                }`}
              >
                {subtitle}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(slide);
                }}
                className="flex items-center justify-center px-6 py-2.5 rounded-full bg-elevated/50 backdrop-blur-md border border-brd text-sm font-bold text-txt hover:bg-txt hover:text-bg transition-colors w-fit min-w-32 shadow-sm cursor-pointer"
              >
                Play {label}
              </button>
            </div>

            {/* Cover art background */}
            <div className="absolute right-0 top-0 h-full w-2/3 overflow-hidden">
              <img
                src={cover}
                alt={title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, black 50%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 50%)',
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Progress indicators capsule - centered, high contrast, easy to click */}
      {count > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {slides.map((slide, i) => {
            const isActive = i === index;
            return (
              <button
                key={`pill-${slide.type}-${slide.item._id || i}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                  isActive ? 'w-8 bg-white/30' : 'w-4 bg-white/20 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={isActive}
              >
                {isActive && (
                  <span
                    key={`bar-${timerKey}`}
                    onAnimationEnd={goNext}
                    className="absolute inset-0 origin-left rounded-full"
                    style={{
                      backgroundColor: accentColor,
                      animation: `pb-showcase-progress ${SLIDE_DURATION_MS}ms linear forwards`,
                      animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

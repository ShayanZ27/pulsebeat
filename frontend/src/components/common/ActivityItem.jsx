import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowUpRight, Disc3, Heart, ListMusic, ListPlus, Music2, Pause, Play } from 'lucide-react';
import { useRecordPlayMutation } from '../../store/api';
import {
  playTrack,
  selectCurrentTrack,
  selectIsPlaying,
  togglePlay,
} from '../../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { formatRelativeTime, getInitials } from '../../utils/format';
import { contrastText } from '../../utils/color';
import { toTrack } from '../../utils/track';
import HeartbeatIndicator from './HeartbeatIndicator';

const BADGE_ICONS = { like: Heart, release: Disc3, add: ListPlus };
const KIND_LABELS = { track: 'Track', album: 'Album', playlist: 'Playlist' };
const KIND_ICONS = { track: Music2, album: Disc3, playlist: ListMusic };

/* ── Playback helpers shared by compact + full rows ── */
function useActivityPlayback() {
  const dispatch = useDispatch();
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);
  const [recordPlay] = useRecordPlayMutation();

  const isCurrent = (song) => Boolean(song?._id && currentTrack?._id && String(currentTrack._id) === String(song._id));
  const isLive = (song) => isCurrent(song) && isPlaying;

  const play = (song) => {
    if (!song) return;
    if (isCurrent(song)) {
      dispatch(togglePlay());
      return;
    }
    const track = toTrack(song);
    if (!track) return;
    dispatch(playTrack(track));
    recordPlay(track._id).catch(() => {});
  };

  return { isCurrent, isLive, play };
}

/* ── Avatar: real profile picture or initials monogram, plus action badge ── */
export function ActivityAvatar({ user, name, badge, size = 44, accentColor, isLive = false }) {
  const BadgeIcon = BADGE_ICONS[badge];
  const picture = user?.profilePicture;
  const badgeSize = Math.round(size * 0.42);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {isLive && (
        <span
          className="absolute inset-0 rounded-full pb-heartbeat-halo pointer-events-none"
          style={{ border: `2px solid ${accentColor}` }}
        />
      )}
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-2 bg-elevated"
        style={{ borderColor: isLive ? accentColor : 'var(--color-brd, rgba(255,255,255,0.08))' }}
      >
        {picture ? (
          <img src={picture} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span
            className="w-full h-full flex items-center justify-center font-space font-bold"
            style={{
              fontSize: Math.round(size * 0.34),
              color: contrastText(accentColor),
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
            }}
          >
            {getInitials(name)}
          </span>
        )}
      </div>
      {BadgeIcon && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center border-2 border-bg bg-sidebar"
          style={{ width: badgeSize, height: badgeSize, color: accentColor }}
          title={badge === 'like' ? 'Liked' : badge === 'release' ? 'New release' : 'Added to playlist'}
        >
          <BadgeIcon
            size={Math.round(badgeSize * 0.55)}
            fill={badge === 'like' ? accentColor : 'none'}
            strokeWidth={2.5}
          />
        </span>
      )}
    </div>
  );
}

/* ── Primary action button: Play / heartbeat (songs) or Open (collections) ── */
function ActionButton({ info, size = 34, playback, accentColor, accentTextColor, onOpen, variant }) {
  if (info.actionType === 'play') {
    const live = playback.isLive(info.track);
    const current = playback.isCurrent(info.track);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          playback.play(info.track);
        }}
        className="group/btn relative rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
        style={{
          width: size,
          height: size,
          backgroundColor: live || variant === 'full' ? accentColor : 'transparent',
          color: live || variant === 'full' ? accentTextColor : accentColor,
          border: live || variant === 'full' ? 'none' : `1.5px solid ${accentColor}55`,
        }}
        title={live ? 'Pause' : current ? 'Resume' : `Play "${info.title}"`}
        aria-label={live ? `Pause ${info.title}` : `Play ${info.title}`}
      >
        {live ? (
          <>
            <span className="group-hover/btn:hidden flex">
              <HeartbeatIndicator color={accentTextColor} size={Math.round(size * 0.55)} />
            </span>
            <Pause size={Math.round(size * 0.4)} fill="currentColor" className="hidden group-hover/btn:block" />
          </>
        ) : (
          <Play size={Math.round(size * 0.4)} fill="currentColor" className="ml-0.5" />
        )}
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-space font-bold border border-brd bg-elevated text-txt hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        style={{ boxShadow: `inset 0 0 0 1px ${accentColor}33` }}
        title={`Open ${KIND_LABELS[info.kind].toLowerCase()}`}
      >
        Open <ArrowUpRight size={14} style={{ color: accentColor }} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className="rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95"
      style={{ width: size, height: size, color: accentColor, border: `1.5px solid ${accentColor}55` }}
      title={`Open ${KIND_LABELS[info.kind].toLowerCase()}`}
      aria-label={`Open ${info.title}`}
    >
      <ArrowUpRight size={Math.round(size * 0.45)} />
    </button>
  );
}

function Artwork({ src, kind, size, className = '' }) {
  const KindIcon = KIND_ICONS[kind] || Music2;
  return (
    <div
      className={`shrink-0 overflow-hidden bg-elevated border border-brd flex items-center justify-center text-txt-muted ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <KindIcon size={Math.round(size * 0.45)} />}
    </div>
  );
}

/**
 * One activity entry.
 * variant="compact" → right-panel preview; variant="full" → "View all" modal card.
 */
export default function ActivityItem({ info, variant = 'compact', onNavigate }) {
  const navigate = useNavigate();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const playback = useActivityPlayback();

  const live = info.actionType === 'play' && playback.isLive(info.track);
  const relatedLive = info.relatedTrack && playback.isLive(info.relatedTrack);

  const go = (path) => {
    if (!path) return;
    navigate(path);
    onNavigate?.();
  };
  const openContent = () => go(info.href);
  const openUser = () => {
    if (info.isArtist && info.user?._id) go(`/artist/${info.user._id}`);
  };
  const handleTitleClick = (e) => {
    e.stopPropagation();
    if (info.actionType === 'play') playback.play(info.track);
    else openContent();
  };

  const timeText = info.createdAt ? formatRelativeTime(info.createdAt) : '';

  /* ───────── Compact (right panel) ───────── */
  if (variant === 'compact') {
    return (
      <div
        className="relative flex items-start gap-3.5 group rounded-2xl -mx-3 px-3 py-2.5 transition-colors hover:bg-elevated/60"
        style={live ? { backgroundColor: `${accentColor}12` } : undefined}
      >
        <ActivityAvatar
          user={info.user}
          name={info.userName}
          badge={info.badge}
          size={40}
          accentColor={accentColor}
          isLive={live}
        />

        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] leading-snug text-txt-sec line-clamp-2">
            <button
              type="button"
              onClick={openUser}
              className={`font-bold text-txt ${info.isArtist ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
            >
              {info.userName}
            </button>{' '}
            {info.verb}
          </p>

          <button
            type="button"
            onClick={handleTitleClick}
            className="mt-1.5 flex items-center gap-2 max-w-full text-left cursor-pointer group/title"
          >
            <Artwork src={info.cover} kind={info.kind} size={22} className="rounded-md" />
            <span
              className="text-[12px] font-bold truncate group-hover/title:underline"
              style={{ color: live ? accentColor : undefined }}
            >
              {info.title}
            </span>
          </button>

          <p className="text-[9px] font-space font-bold text-txt-muted/60 mt-1.5 uppercase tracking-widest flex items-center gap-1.5">
            {live ? (
              <span className="flex items-center gap-1" style={{ color: accentColor }}>
                <HeartbeatIndicator color={accentColor} size={12} /> Now playing
              </span>
            ) : (
              timeText
            )}
          </p>
        </div>

        <div className="pt-1">
          <ActionButton
            info={info}
            size={32}
            playback={playback}
            accentColor={accentColor}
            accentTextColor={accentTextColor}
            onOpen={openContent}
            variant="compact"
          />
        </div>
      </div>
    );
  }

  /* ───────── Full (View all modal) ───────── */
  const KindIcon = KIND_ICONS[info.kind] || Music2;
  return (
    <div
      className="relative rounded-3xl border bg-elevated/40 p-4 sm:p-5 transition-all hover:bg-elevated/70"
      style={{
        borderColor: live ? `${accentColor}88` : 'var(--color-brd, rgba(255,255,255,0.08))',
        boxShadow: live ? `0 0 0 1px ${accentColor}33, 0 10px 40px -12px ${accentColor}55` : undefined,
      }}
    >
      {/* Who did what, when */}
      <div className="flex items-center gap-3.5 mb-4">
        <ActivityAvatar
          user={info.user}
          name={info.userName}
          badge={info.badge}
          size={46}
          accentColor={accentColor}
          isLive={live}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-txt-sec">
            <button
              type="button"
              onClick={openUser}
              className={`font-bold text-txt ${info.isArtist ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
            >
              {info.userName}
            </button>
            {info.isArtist && (
              <span
                className="ml-1.5 align-middle inline-flex px-1.5 py-px rounded-full text-[9px] font-space font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
              >
                Artist
              </span>
            )}{' '}
            {info.verb}
          </p>
          <p className="text-[10px] font-space font-bold text-txt-muted/70 mt-1 uppercase tracking-widest">
            {timeText}
          </p>
        </div>
        {live && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-space font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${accentColor}1f`, color: accentColor }}
          >
            <HeartbeatIndicator color={accentColor} size={14} /> Now playing
          </span>
        )}
      </div>

      {/* The content itself */}
      <div
        onClick={info.actionType === 'open' ? openContent : undefined}
        className={`flex items-center gap-4 rounded-2xl bg-sidebar/80 border border-brd p-3 ${info.actionType === 'open' ? 'cursor-pointer group/content' : ''}`}
      >
        <div className="relative">
          <Artwork
            src={info.cover}
            kind={info.kind}
            size={60}
            className={info.kind === 'album' ? 'rounded-xl' : 'rounded-2xl'}
          />
          {live && (
            <div className="absolute inset-0 rounded-2xl bg-black/45 flex items-center justify-center">
              <HeartbeatIndicator color="#fff" size={26} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 text-[9px] font-space font-bold uppercase tracking-widest text-txt-muted mb-1">
            <KindIcon size={10} style={{ color: accentColor }} /> {KIND_LABELS[info.kind]}
          </span>
          <button
            type="button"
            onClick={handleTitleClick}
            className="block max-w-full text-left text-[15px] font-playfair font-black text-txt truncate hover:underline cursor-pointer"
            style={{ color: live ? accentColor : undefined }}
          >
            {info.title}
          </button>
          {info.relatedTrack ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playback.play(info.relatedTrack);
              }}
              className="mt-1 inline-flex items-center gap-1.5 max-w-full pl-1 pr-2.5 py-0.5 rounded-full bg-elevated border border-brd text-[11px] font-semibold text-txt-sec hover:text-txt transition-colors cursor-pointer"
              title={`Play "${info.relatedTrack.title}"`}
            >
              <span
                className="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accentColor, color: accentTextColor, width: 18, height: 18 }}
              >
                {relatedLive ? (
                  <HeartbeatIndicator color={accentTextColor} size={12} />
                ) : (
                  <Play size={9} fill="currentColor" className="ml-px" />
                )}
              </span>
              <span className="truncate">+ {info.relatedTrack.title}</span>
            </button>
          ) : (
            <p className="text-xs font-medium text-txt-muted truncate mt-0.5">{info.subtitle}</p>
          )}
        </div>

        <ActionButton
          info={info}
          size={44}
          playback={playback}
          accentColor={accentColor}
          accentTextColor={accentTextColor}
          onOpen={openContent}
          variant="full"
        />
      </div>
    </div>
  );
}

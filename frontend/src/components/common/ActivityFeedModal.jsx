import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Users, X } from 'lucide-react';
import { useGetActivityFeedQuery } from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { ACTIVITY_FILTERS, describeActivity } from '../../utils/activity';
import { LogoPulseSVG } from '../icons/LineArt';
import ActivityItem from './ActivityItem';
import { HeartbeatLoader } from './PulseAnimations';

const FULL_FEED_LIMIT = 50;

/** Groups entries into "Today" / "Yesterday" / "Earlier" sections. */
function groupByDay(items) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  const groups = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ];
  for (const item of items) {
    const t = new Date(item.createdAt).getTime();
    if (t >= startOfToday.getTime()) groups[0].items.push(item);
    else if (t >= startOfYesterday.getTime()) groups[1].items.push(item);
    else groups[2].items.push(item);
  }
  return groups.filter((g) => g.items.length);
}

export default function ActivityFeedModal({ isOpen = false, onClose }) {
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const [filter, setFilter] = useState('all');

  const { data = [], isLoading, isFetching } = useGetActivityFeedQuery(FULL_FEED_LIMIT, {
    skip: !isOpen,
    refetchOnMountOrArgChange: 30,
  });

  const entries = useMemo(() => data.map(describeActivity).filter(Boolean), [data]);
  const counts = useMemo(() => {
    const c = { all: entries.length, music: 0, album: 0, playlist: 0 };
    entries.forEach((e) => { c[e.filterKey] = (c[e.filterKey] || 0) + 1; });
    return c;
  }, [entries]);
  const visible = filter === 'all' ? entries : entries.filter((e) => e.filterKey === filter);
  const groups = groupByDay(visible);

  useEffect(() => {
    if (!isOpen) return;
    setFilter('all');
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-feed-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[86vh] flex flex-col bg-sidebar border border-brd rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Ambient accent glows */}
        <div
          className="absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Header */}
        <div className="relative z-10 px-6 sm:px-8 pt-7 pb-5 border-b border-brd">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl bg-elevated border border-brd flex items-center justify-center shadow-sm"
              >
                <LogoPulseSVG color={accentColor} size={26} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-space font-bold uppercase tracking-wider mb-1 bg-elevated border border-brd text-txt-muted">
                  <Users size={11} style={{ color: accentColor }} /> The Pulse
                </div>
                <h2
                  id="activity-feed-title"
                  className="text-2xl sm:text-[28px] font-playfair font-black text-txt tracking-tight leading-tight"
                >
                  Friend Activity
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-elevated hover:bg-bg border border-brd flex items-center justify-center text-txt-muted hover:text-txt transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto scrollbar-hide">
            {ACTIVITY_FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-space font-bold border transition-all cursor-pointer shrink-0 ${
                    active ? 'border-transparent shadow-md' : 'border-brd bg-elevated text-txt-sec hover:text-txt'
                  }`}
                  style={active ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                >
                  {label}
                  <span className={`text-[10px] ${active ? 'opacity-80' : 'text-txt-muted'}`}>
                    {counts[key] || 0}
                  </span>
                </button>
              );
            })}
            {isFetching && !isLoading && (
              <HeartbeatLoader size={16} color="var(--text-muted)" className="ml-1" />
            )}
          </div>
        </div>

        {/* Feed */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-7">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <HeartbeatLoader
                variant="block"
                size={28}
                text="Tuning into friend activity…"
                color={accentColor}
              />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-elevated border border-brd flex items-center justify-center mb-4">
                <LogoPulseSVG color={accentColor} size={30} />
              </div>
              <p className="text-lg font-playfair font-black text-txt">It's quiet in here</p>
              <p className="text-sm text-txt-muted mt-1 max-w-xs">
                {filter === 'all'
                  ? 'Likes, new releases and playlist adds will show up here.'
                  : `No ${ACTIVITY_FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} activity yet.`}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.label}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-[11px] font-space font-bold uppercase tracking-[0.2em] text-txt-muted">
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-brd" />
                </div>
                <div className="space-y-3">
                  {group.items.map((info) => (
                    <ActivityItem key={info.id} info={info} variant="full" onNavigate={onClose} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

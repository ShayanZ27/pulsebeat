import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  X,
  Flag,
  ShieldAlert,
  AlertTriangle,
  Ban,
  HelpCircle,
  Music2,
  Disc3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useReportContentMutation } from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { getDisplayName } from '../../utils/format';
import { showToast } from '../../utils/toast';
import { HeartbeatLoader } from './PulseAnimations';

const REPORT_REASONS = [
  {
    id: 'copyright',
    label: 'Copyright or IP Infringement',
    description: 'Unauthorized audio, stolen content, or artwork copyright violation',
    icon: ShieldAlert,
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate or Explicit Content',
    description: 'Sexually explicit, violently graphic, or offensive material',
    icon: AlertTriangle,
  },
  {
    id: 'abusive',
    label: 'Abusive or Harmful Content',
    description: 'Hate speech, targeted harassment, defamation, or encouragement of harm',
    icon: Flag,
  },
  {
    id: 'spam',
    label: 'Spam or Misleading',
    description: 'Deceptive metadata, duplicate track upload, or fraudulent scam',
    icon: Ban,
  },
  {
    id: 'other',
    label: 'Other Issue',
    description: 'A violation or problem not covered by the categories above',
    icon: HelpCircle,
  },
];

export default function ReportModal({
  isOpen = false,
  onClose,
  item = null,
  itemType = 'track',
}) {
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const [reportContent, { isLoading }] = useReportContentMutation();

  const [selectedReason, setSelectedReason] = useState('copyright');
  const [description, setDescription] = useState('');
  const [errorNotice, setErrorNotice] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Derive target content info
  const isAlbum = itemType === 'album';
  const isUser = itemType === 'user';
  const contentType = isAlbum ? 'Album' : isUser ? 'User' : 'Music';

  const itemId = item?._id || item?.id;
  const title = item?.title || item?.name || item?.username || 'Untitled';
  const artistName = item?.artist ? getDisplayName(item.artist) : null;
  const coverUrl = item?.coverImage || item?.album?.coverImage || item?.profilePicture;

  useEffect(() => {
    if (isOpen) {
      setSelectedReason('copyright');
      setDescription('');
      setErrorNotice(null);
      setIsDuplicate(false);
    }
  }, [isOpen, itemId]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason || !itemId) return;

    setErrorNotice(null);
    setIsDuplicate(false);

    try {
      await reportContent({
        reportedContent: itemId,
        contentType,
        reason: selectedReason,
        description: description.trim(),
      }).unwrap();

      showToast('Report submitted. Thank you for helping keep PulseBeat safe!', 'success');
      onClose();
    } catch (err) {
      const message = err?.message || err?.data?.message || 'Failed to submit report';
      if (message.toLowerCase().includes('already reported')) {
        setIsDuplicate(true);
      } else {
        setErrorNotice(message);
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="relative w-full max-w-lg bg-card border border-brd rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-brd flex items-center justify-between gap-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
              <Flag size={20} />
            </div>
            <div className="min-w-0">
              <h2 id="report-modal-title" className="text-base sm:text-lg font-bold font-space text-txt truncate">
                Report {contentType === 'Music' ? 'Track' : contentType}
              </h2>
              <p className="text-xs text-txt-sec truncate">
                Help our moderation team keep PulseBeat safe and authentic
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full bg-elevated hover:bg-white/10 text-txt-sec hover:text-txt flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto relative z-10 flex-1">
          {/* Target Content Snippet */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-elevated/80 border border-brd">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-sidebar border border-brd shrink-0 flex items-center justify-center shadow-xs">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              ) : isAlbum ? (
                <Disc3 size={20} className="text-txt-muted" />
              ) : (
                <Music2 size={20} className="text-txt-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-space text-txt truncate">
                  {title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-card border border-brd text-txt-muted font-space shrink-0 uppercase tracking-wider">
                  {contentType === 'Music' ? 'Track' : contentType}
                </span>
              </div>
              {artistName && (
                <p className="text-xs text-txt-sec truncate mt-0.5">
                  by {artistName}
                </p>
              )}
            </div>
          </div>

          {/* Duplicate Report Warning */}
          {isDuplicate && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300/90 dark:border-amber-500/25 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in">
              <AlertCircle size={16} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Report Already Under Review</p>
                <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-300/90">
                  You have already submitted a report for this {contentType.toLowerCase()}. Our curation team is currently reviewing it.
                </p>
              </div>
            </div>
          )}

          {/* General Error Notice */}
          {errorNotice && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-xs text-red-900 dark:text-red-300 animate-in fade-in">
              <AlertTriangle size={15} className="text-red-600 dark:text-red-400 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-txt flex items-center justify-between">
              <span>Why are you reporting this?</span>
              <span className="text-red-500">*</span>
            </label>

            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => {
                      setSelectedReason(reason.id);
                      setErrorNotice(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-elevated border-txt/40 shadow-xs'
                        : 'bg-card hover:bg-elevated/50 border-brd'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: accentColor }
                        : undefined
                    }
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-primary/15' : 'bg-elevated text-txt-muted'
                      }`}
                      style={isSelected ? { color: accentColor } : undefined}
                    >
                      <Icon size={14} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-txt">
                        {reason.label}
                      </p>
                      <p className="text-[11px] text-txt-sec leading-snug mt-0.5">
                        {reason.description}
                      </p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                        isSelected
                          ? 'border-transparent'
                          : 'border-brd bg-card'
                      }`}
                      style={isSelected ? { backgroundColor: accentColor } : undefined}
                    >
                      {isSelected && (
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: accentTextColor }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor="report-description" className="text-xs font-semibold text-txt">
                Additional Details <span className="text-txt-muted font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-txt-muted font-space">
                {description.length}/500
              </span>
            </div>
            <textarea
              id="report-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Tell us more about the issue you encountered (timestamps, links, or specific context)..."
              disabled={isLoading || isDuplicate}
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-xs text-txt placeholder:text-txt-muted/50 focus:outline-none focus:border-txt/50 transition-colors resize-none disabled:opacity-50"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-full text-xs font-space font-bold text-txt-sec hover:text-txt hover:bg-elevated border border-transparent hover:border-brd transition-all cursor-pointer disabled:opacity-50"
            >
              {isDuplicate ? 'Close' : 'Cancel'}
            </button>

            {!isDuplicate && (
              <button
                type="submit"
                disabled={!selectedReason || isLoading}
                className="px-6 py-2.5 rounded-full text-xs font-space font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  backgroundColor: accentColor,
                  color: accentTextColor,
                }}
              >
                {isLoading ? (
                  <>
                    <HeartbeatLoader size="sm" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Flag size={13} />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

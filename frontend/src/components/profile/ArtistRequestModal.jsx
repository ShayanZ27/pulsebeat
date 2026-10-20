import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  X,
  Sparkles,
  Music,
  Radio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { useRequestArtistRoleMutation } from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { showToast } from '../../utils/toast';

export default function ArtistRequestModal({
  isOpen = false,
  onClose,
  onSubmitted,
  previousFeedback = null,
}) {
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const [requestArtistMutation, { isLoading: isSubmitting }] = useRequestArtistRoleMutation();

  const [statement, setStatement] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStatement('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const charCount = statement.trim().length;
  const isValidLength = charCount >= 10 && charCount <= 500;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (charCount < 10) {
      setError('Please provide a statement of at least 10 characters.');
      return;
    }
    if (charCount > 500) {
      setError('Statement cannot exceed 500 characters.');
      return;
    }

    try {
      await requestArtistMutation({ statement: statement.trim() }).unwrap();
      showToast('Artist application submitted successfully!', 'success');
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error('Artist request error:', err);
      setError(
        err?.data?.message ||
        err?.message ||
        'Failed to submit request. You can submit one request every 24 hours.'
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-brd rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with decorative glow */}
        <div className="relative px-6 py-5 border-b border-brd bg-gradient-to-r from-card via-elevated to-card overflow-hidden">
          <div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold font-space text-txt">Apply for Artist Status</h2>
                <p className="text-[11px] text-txt-muted">Join the PulseBeat creator collective</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-txt-muted hover:text-txt hover:bg-elevated transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Perks Summary Pill */}
          <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-elevated/60 border border-brd text-xs">
            <div className="flex items-center gap-2 text-txt">
              <Music size={14} style={{ color: accentColor }} />
              <span className="text-[11px]">Upload Original Music</span>
            </div>
            <div className="flex items-center gap-2 text-txt">
              <Radio size={14} style={{ color: accentColor }} />
              <span className="text-[11px]">Verified Artist Badge</span>
            </div>
          </div>

          {/* Note from last review if reapplying */}
          {previousFeedback && (
            <div className="p-3.5 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300/90 dark:border-amber-500/20 text-xs space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold font-space text-amber-900 dark:text-amber-400 text-[11px] uppercase tracking-wide">
                <AlertCircle size={14} className="text-amber-700 dark:text-amber-400 shrink-0" />
                Feedback from your previous review
              </div>
              <p className="text-txt-sec text-xs italic pl-3 border-l-2 border-amber-400 dark:border-amber-500/40">
                "{previousFeedback}"
              </p>
            </div>
          )}

          {/* Statement Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-txt">
                Artist Statement & Bio <span className="text-red-400">*</span>
              </label>
              <span
                className={`text-[11px] font-space font-medium ${
                  charCount < 10
                    ? 'text-txt-muted'
                    : charCount > 500
                    ? 'text-red-400'
                    : 'text-txt-sec'
                }`}
              >
                {charCount}/500 chars (min 10)
              </span>
            </div>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={5}
              placeholder="Tell our review team about your music style, background, instrument/genre, links to existing work, or what you intend to publish on PulseBeat..."
              className="w-full px-3.5 py-3 rounded-xl bg-elevated border border-brd text-txt text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-txt-muted leading-relaxed"
            />
          </div>

          {/* Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-elevated/40 border border-brd text-txt-muted text-[11px]">
            <Info size={14} className="shrink-0 mt-0.5 text-txt-sec" />
            <span>
              Submissions are reviewed by administrators. You can submit one request every 24 hours.
              Once approved, your account will gain artist publishing capabilities.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-txt-sec hover:text-txt hover:bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidLength}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-space flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
              style={{
                backgroundColor: accentColor,
                color: accentTextColor,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  X,
  Music2,
  Globe,
  Lock,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useCreatePlaylistMutation, useGetUserPlaylistsQuery } from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { showToast } from '../../utils/toast';
import { HeartbeatLoader } from './PulseAnimations';

export default function CreatePlaylistModal({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const { data: userPlaylists = [] } = useGetUserPlaylistsQuery(undefined, { skip: !isOpen });
  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);

  // Set default suggested playlist name when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultName = `My Playlist #${(userPlaylists?.length || 0) + 1}`;
      setName(defaultName);
      setDescription('');
      setIsPublic(true);
      setError(null);

      // Auto-focus and select text for effortless replacement or submission
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, userPlaylists?.length]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Playlist name is required');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setError(null);
    try {
      const result = await createPlaylist({
        name: trimmedName,
        description: description.trim(),
        isPublic,
      }).unwrap();

      const createdId = result?._id || result?.data?._id;
      showToast(`Created playlist "${trimmedName}"`);
      onClose();

      if (createdId) {
        navigate(`/playlist/${createdId}`);
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to create playlist';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-playlist-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-sidebar border border-brd rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Ambient accent background glow */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-elevated border border-brd flex items-center justify-center shadow-sm"
              style={{ color: accentColor }}
            >
              <Music2 size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-space font-bold uppercase tracking-wider mb-1 bg-elevated border border-brd text-txt-muted">
                <Sparkles size={11} style={{ color: accentColor }} /> New Collection
              </div>
              <h2
                id="create-playlist-title"
                className="text-2xl font-playfair font-black text-txt tracking-tight leading-tight"
              >
                Create Playlist
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Playlist Name Field */}
          <div>
            <label
              htmlFor="playlist-name-input"
              className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-1.5"
            >
              Playlist Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="playlist-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Midnight Grooves"
              maxLength={80}
              className={`w-full px-4 py-3 rounded-2xl bg-elevated border text-sm font-bold text-txt placeholder:text-txt-muted/50 focus:outline-none transition-colors ${
                error
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-brd focus:border-primary'
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
          </div>

          {/* Description Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="playlist-desc-input"
                className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted"
              >
                Description <span className="text-[10px] lowercase text-txt-muted font-normal">(optional)</span>
              </label>
              <span className="text-[10px] font-space text-txt-muted">
                {description.length}/50
              </span>
            </div>
            <textarea
              id="playlist-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 50))}
              placeholder="Give your playlist a vibe or mood..."
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-2xl bg-elevated border border-brd text-sm text-txt placeholder:text-txt-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="p-3 rounded-2xl bg-elevated/70 border border-brd flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-sidebar border border-brd text-txt-muted">
                {isPublic ? <Globe size={16} /> : <Lock size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-txt">
                  {isPublic ? 'Public Playlist' : 'Private Playlist'}
                </p>
                <p className="text-[11px] text-txt-muted truncate">
                  {isPublic ? 'Discoverable on PulseBeat' : 'Visible only to you'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                isPublic
                  ? 'border border-transparent'
                  : 'bg-neutral-300 dark:bg-neutral-700 border border-neutral-400/40 dark:border-neutral-600/50'
              }`}
              style={isPublic ? { backgroundColor: accentColor } : undefined}
              role="switch"
              aria-checked={isPublic}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-all duration-200 shadow-md ${
                  isPublic
                    ? 'translate-x-6'
                    : 'translate-x-1 ring-1 ring-black/10 dark:ring-white/10'
                }`}
                style={{
                  backgroundColor: isPublic ? accentTextColor : '#FFFFFF',
                }}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-5 py-2.5 rounded-full text-xs font-space font-bold text-txt-sec hover:text-txt hover:bg-elevated border border-transparent hover:border-brd transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="px-6 py-2.5 rounded-full text-xs font-space font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              {isCreating ? (
                <>
                  <HeartbeatLoader size={16} color={accentTextColor} /> Creating...
                </>
              ) : (
                <>
                  <Plus size={16} /> Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

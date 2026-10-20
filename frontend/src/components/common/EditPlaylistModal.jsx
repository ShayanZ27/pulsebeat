import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  X,
  Camera,
  Trash2,
  Globe,
  Lock,
  Music2,
  Check,
} from 'lucide-react';
import { useUpdatePlaylistMutation } from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { showToast } from '../../utils/toast';
import { HeartbeatLoader } from './PulseAnimations';

export default function EditPlaylistModal({ isOpen = false, onClose, playlist = null }) {
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const [updatePlaylist, { isLoading: isUpdating }] = useUpdatePlaylistMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [deleteCover, setDeleteCover] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && playlist) {
      setName(playlist.name || '');
      setDescription(playlist.description || '');
      setIsPublic(Boolean(playlist.isPublic));
      setCoverPreview(playlist.coverImage || '');
      setCoverFile(null);
      setDeleteCover(false);
      setError(null);

      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, playlist]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !playlist) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setDeleteCover(false);
    setError(null);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setDeleteCover(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Playlist name is required');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }

    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('description', description.trim());
      formData.append('isPublic', String(isPublic));

      if (coverFile) {
        formData.append('coverImage', coverFile);
      } else if (deleteCover) {
        formData.append('deleteCoverImage', 'true');
      }

      await updatePlaylist({ id: playlist._id, data: formData }).unwrap();

      showToast(`Updated "${trimmedName}"`);
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to update playlist';
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
      aria-labelledby="edit-playlist-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-sidebar border border-brd rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Ambient accent background glow */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2
              id="edit-playlist-title"
              className="text-2xl font-playfair font-black text-txt tracking-tight leading-tight"
            >
              Edit Details
            </h2>
            <p className="text-xs text-txt-sec mt-0.5 font-space">
              Update name, description, privacy, and artwork
            </p>
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
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            {/* Cover Image Uploader */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="edit-playlist-cover-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-36 h-36 rounded-2xl overflow-hidden border border-brd bg-elevated shadow-md cursor-pointer flex items-center justify-center"
                title="Click to choose a photo"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Playlist Cover Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-txt-muted gap-1">
                    <Music2 size={40} className="opacity-40" />
                    <span className="text-[10px] font-space font-semibold">No Artwork</span>
                  </div>
                )}

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs">
                  <Camera size={24} />
                  <span className="text-[11px] font-space font-bold">Choose photo</span>
                </div>
              </div>

              {coverPreview && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-space transition-colors cursor-pointer py-0.5"
                >
                  <Trash2 size={12} /> Remove photo
                </button>
              )}
            </div>

            {/* Inputs: Name & Description */}
            <div className="flex-1 min-w-0 w-full space-y-3.5">
              {/* Name */}
              <div>
                <label
                  htmlFor="edit-playlist-name"
                  className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-1"
                >
                  Playlist Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="edit-playlist-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  maxLength={80}
                  placeholder="Playlist name"
                  className={`w-full px-4 py-2.5 rounded-xl bg-elevated border text-sm font-bold text-txt placeholder:text-txt-muted/50 focus:outline-none transition-colors ${
                    error
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-brd focus:border-primary'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="edit-playlist-desc"
                    className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted"
                  >
                    Description <span className="text-[10px] lowercase text-txt-muted font-normal">(optional)</span>
                  </label>
                  <span className="text-[10px] font-space text-txt-muted">
                    {description.length}/50
                  </span>
                </div>
                <textarea
                  id="edit-playlist-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 50))}
                  placeholder="Add an optional description"
                  maxLength={50}
                  className="w-full px-4 py-2 rounded-xl bg-elevated border border-brd text-sm text-txt placeholder:text-txt-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="p-3.5 rounded-2xl bg-elevated/70 border border-brd flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-sidebar border border-brd text-txt-muted">
                {isPublic ? <Globe size={16} /> : <Lock size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-txt">
                  {isPublic ? 'Public Playlist' : 'Private Playlist'}
                </p>
                <p className="text-[11px] text-txt-muted truncate">
                  {isPublic ? 'Visible and discoverable by everyone' : 'Only visible to you'}
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

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-full text-xs font-space font-bold text-txt-sec hover:text-txt hover:bg-elevated border border-transparent hover:border-brd transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUpdating || !name.trim()}
              className="px-6 py-2.5 rounded-full text-xs font-space font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              {isUpdating ? (
                <>
                  <HeartbeatLoader size={16} color={accentTextColor} /> Saving...
                </>
              ) : (
                <>
                  <Check size={16} /> Save
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

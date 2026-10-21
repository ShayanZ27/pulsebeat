import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  X,
  Disc,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  Search,
  Music2,
} from 'lucide-react';
import { useCreateAlbumMutation } from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { showToast } from '../../utils/toast';
import { formatTime } from '../../utils/format';
import { HeartbeatLoader } from '../common/PulseAnimations';

export default function CreateAlbumModal({
  isOpen = false,
  onClose,
  onSuccess,
  availableTracks = [],
}) {
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const [createAlbum, { isLoading }] = useCreateAlbumMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const coverInputRef = useRef(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setCoverFile(null);
      setCoverPreview(null);
      setSelectedTrackIds([]);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const handleCoverSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file for the album cover');
      return;
    }
    setError(null);
    setCoverFile(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const toggleTrack = (trackId) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTrackIds(availableTracks.map((t) => t._id));
  };

  const handleDeselectAll = () => {
    setSelectedTrackIds([]);
  };

  const filteredTracks = availableTracks.filter((t) =>
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Album title is required');
      return;
    }
    if (!description.trim()) {
      setError('Album description is required');
      return;
    }
    if (!coverFile) {
      setError('Please upload an album cover image');
      return;
    }
    if (selectedTrackIds.length === 0) {
      setError('Please select at least one song for the album');
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('coverImage', coverFile);
    formData.append('songs', JSON.stringify(selectedTrackIds));

    try {
      await createAlbum(formData).unwrap();
      showToast(`Album "${title.trim()}" created successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to create album';
      setError(msg);
      showToast(msg, 'error');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={isLoading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-album-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-card border border-brd rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
      >
        {/* Glow */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-elevated border border-brd flex items-center justify-center shadow-sm"
              style={{ color: accentColor }}
            >
              <Disc size={24} />
            </div>
            <div>
              <span className="text-[10px] font-space font-bold uppercase tracking-wider text-txt-muted px-2.5 py-0.5 rounded-full bg-elevated border border-brd">
                PulseBeat Discography
              </span>
              <h2
                id="create-album-title"
                className="text-2xl font-space font-extrabold text-txt tracking-tight mt-1"
              >
                Create New Album
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-elevated hover:bg-bg border border-brd flex items-center justify-center text-txt-muted hover:text-txt transition-colors cursor-pointer disabled:opacity-40"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-400 shrink-0">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1 relative z-10">
          {/* Cover & Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cover image */}
            <div>
              <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-2">
                Album Cover <span className="text-red-500">*</span>
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverSelect(e.target.files?.[0])}
                className="hidden"
              />
              <div
                onClick={() => coverInputRef.current?.click()}
                className="relative aspect-square rounded-2xl overflow-hidden border border-brd bg-elevated/60 hover:bg-elevated flex flex-col items-center justify-center cursor-pointer group shadow-sm transition-all"
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Album Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                      <ImageIcon size={20} />
                      <span className="text-[10px] font-space font-semibold">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center text-txt-muted group-hover:text-txt">
                    <ImageIcon size={28} className="mb-1" />
                    <span className="text-[11px] font-space font-semibold">Upload Art</span>
                    <span className="text-[9px] text-txt-muted">Square (1:1)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="sm:col-span-2 space-y-3.5">
              <div>
                <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-1">
                  Album Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A Head Full of Dreams"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-sm font-bold text-txt placeholder:text-txt-muted/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell listeners the story behind this album..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-xs text-txt placeholder:text-txt-muted/50 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Song Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
                  Select Tracks ({selectedTrackIds.length} of {availableTracks.length} chosen){' '}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-txt-sec">Choose which of your uploaded songs belong in this album.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-space font-semibold bg-elevated hover:bg-bg border border-brd text-txt transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-space font-semibold bg-elevated hover:bg-bg border border-brd text-txt-muted hover:text-txt transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Filter Search */}
            {availableTracks.length > 5 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter uploaded tracks..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-elevated border border-brd text-xs text-txt placeholder:text-txt-muted/50 focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Tracks List */}
            {availableTracks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-elevated/40 border border-dashed border-brd text-center space-y-1">
                <Music2 size={24} className="mx-auto text-txt-muted" />
                <p className="text-xs font-bold font-space text-txt">No tracks available to add</p>
                <p className="text-[11px] text-txt-muted">
                  Please upload individual tracks first before assembling them into an album.
                </p>
              </div>
            ) : filteredTracks.length === 0 ? (
              <p className="text-xs text-txt-muted py-4 text-center">No tracks match "{searchQuery}"</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 rounded-2xl bg-elevated/30 border border-brd">
                {filteredTracks.map((track) => {
                  const isSelected = selectedTrackIds.includes(track._id);
                  return (
                    <div
                      key={track._id}
                      onClick={() => toggleTrack(track._id)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-elevated border-primary/50 shadow-xs'
                          : 'bg-card/50 hover:bg-elevated/50 border-brd/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                            isSelected ? 'bg-primary text-black' : 'border border-brd bg-card'
                          }`}
                          style={isSelected ? { backgroundColor: accentColor, color: accentTextColor } : {}}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>

                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-elevated border border-brd shrink-0">
                          {track.coverImage ? (
                            <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-txt-muted">
                              <Music2 size={13} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold font-space text-txt truncate">{track.title}</p>
                          <p className="text-[10px] text-txt-muted truncate">
                            {track.genre || 'Music'} • {track.mood || 'Track'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-space text-txt-muted shrink-0 pr-1">
                        {formatTime(track.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brd shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-space font-bold text-txt-sec hover:text-txt hover:bg-elevated border border-transparent hover:border-brd transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim() || !description.trim() || !coverFile || selectedTrackIds.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-space font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              {isLoading ? (
                <>
                  <HeartbeatLoader size={16} color={accentTextColor} />
                  Creating Album...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Publish Album
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

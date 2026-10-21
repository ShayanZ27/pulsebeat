import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  X,
  Upload,
  Music2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Trash2,
} from 'lucide-react';
import { useUploadMusicMutation } from '../../store/api';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { showToast } from '../../utils/toast';
import { HeartbeatLoader } from '../common/PulseAnimations';

const GENRES = [
  'Bollywood', 'Pop', 'Rock', 'Hip-Hop', 'Rap',
  'EDM', 'Jazz', 'Classical', 'Indie', 'Instrumental',
];

const MOODS = [
  'Happy', 'Sad', 'Romantic', 'Chill', 'Party',
  'Energetic', 'Focus', 'Sleep', 'Nostalgic', 'Calm',
];

export default function UploadTrackModal({ isOpen = false, onClose, onSuccess }) {
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const [uploadMusic, { isLoading }] = useUploadMusicMutation();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [mood, setMood] = useState(MOODS[0]);
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [error, setError] = useState(null);

  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setGenre(GENRES[0]);
      setMood(MOODS[0]);
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);
      setAudioPreviewUrl(null);
      setIsPlayingPreview(false);
      setError(null);
    }
  }, [isOpen]);

  // Clean up preview object URLs
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [coverPreview, audioPreviewUrl]);

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

  const handleAudioSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file.name)) {
      setError('Please select a valid audio file (.mp3, .wav, .flac, .m4a, .aac, .ogg)');
      return;
    }
    setError(null);
    setAudioFile(file);
    if (!title) {
      // Suggest title from filename without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    const url = URL.createObjectURL(file);
    setAudioPreviewUrl(url);
    setIsPlayingPreview(false);
  };

  const handleCoverSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file for the cover art');
      return;
    }
    setError(null);
    setCoverFile(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const togglePreviewPlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Track title is required');
      return;
    }
    if (!audioFile) {
      setError('Please choose an audio file to upload');
      return;
    }
    if (!coverFile) {
      setError('Please choose a cover image for the track');
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('genre', genre);
    formData.append('mood', mood);
    formData.append('file', audioFile);
    formData.append('coverImage', coverFile);

    try {
      await uploadMusic(formData).unwrap();
      showToast(`"${title.trim()}" published successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to upload track';
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
      aria-labelledby="upload-track-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-card border border-brd rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200"
      >
        {/* Glow */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-elevated border border-brd flex items-center justify-center shadow-sm"
              style={{ color: accentColor }}
            >
              <Upload size={24} />
            </div>
            <div>
              <span className="text-[10px] font-space font-bold uppercase tracking-wider text-txt-muted px-2.5 py-0.5 rounded-full bg-elevated border border-brd">
                PulseBeat Creator Studio
              </span>
              <h2
                id="upload-track-title"
                className="text-2xl font-space font-extrabold text-txt tracking-tight mt-1"
              >
                Upload New Track
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
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Audio File Dropzone */}
          <div>
            <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-2">
              Audio File <span className="text-red-500">*</span>
            </label>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
              onChange={(e) => handleAudioSelect(e.target.files?.[0])}
              className="hidden"
            />
            {audioFile ? (
              <div className="p-4 rounded-2xl bg-elevated border border-brd flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={togglePreviewPlay}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                    title={isPlayingPreview ? 'Pause preview' : 'Play preview'}
                  >
                    {isPlayingPreview ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-bold font-space text-txt truncate">{audioFile.name}</p>
                    <p className="text-[11px] text-txt-muted">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold font-space bg-card hover:bg-bg border border-brd text-txt transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioFile(null);
                      setAudioPreviewUrl(null);
                      setIsPlayingPreview(false);
                    }}
                    className="p-1.5 rounded-xl text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {audioPreviewUrl && (
                  <audio
                    ref={audioPlayerRef}
                    src={audioPreviewUrl}
                    onEnded={() => setIsPlayingPreview(false)}
                    className="hidden"
                  />
                )}
              </div>
            ) : (
              <div
                onClick={() => audioInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleAudioSelect(e.dataTransfer.files?.[0]);
                }}
                className="p-6 rounded-2xl border-2 border-dashed border-brd hover:border-primary/50 bg-elevated/40 hover:bg-elevated/70 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <Music2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold font-space text-txt">
                    Click to browse or drag and drop audio
                  </p>
                  <p className="text-[11px] text-txt-muted mt-0.5">
                    Supports MP3, WAV, FLAC, M4A, AAC, OGG
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cover Art and Track Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cover Art Picker */}
            <div>
              <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-2">
                Cover Art <span className="text-red-500">*</span>
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
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
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

            {/* Title, Genre, Mood */}
            <div className="sm:col-span-2 space-y-3.5">
              {/* Title Field */}
              <div>
                <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-1">
                  Track Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Faded (Instrumental)"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-sm font-bold text-txt placeholder:text-txt-muted/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Genre Selector */}
              <div>
                <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-1">
                  Genre <span className="text-red-500">*</span>
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-xs font-space font-semibold text-txt focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g} className="bg-card text-txt">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood Selector */}
              <div>
                <label className="block text-xs font-space font-bold uppercase tracking-wider text-txt-muted mb-1">
                  Mood <span className="text-red-500">*</span>
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-xs font-space font-semibold text-txt focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m} className="bg-card text-txt">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brd">
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
              disabled={isLoading || !title.trim() || !audioFile || !coverFile}
              className="px-6 py-2.5 rounded-xl text-xs font-space font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              {isLoading ? (
                <>
                  <HeartbeatLoader size={16} color={accentTextColor} />
                  Uploading & Encoding...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Publish Track
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

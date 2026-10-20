import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  X,
  Camera,
  Trash2,
  User,
  AtSign,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useUpdateUserProfileMutation } from '../../store/api';
import { updateUser } from '../../store/authSlice';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { showToast } from '../../utils/toast';

export default function EditProfileModal({ isOpen = false, onClose, user = null }) {
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);

  const [updateProfileMutation, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [deleteAvatar, setDeleteAvatar] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const firstNameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarPreview(user.profilePicture || '');
      setAvatarFile(null);
      setDeleteAvatar(false);
      setError(null);

      setTimeout(() => {
        if (firstNameInputRef.current) {
          firstNameInputRef.current.focus();
        }
      }, 60);
    }
  }, [isOpen, user]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setAvatarFile(file);
    setDeleteAvatar(false);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setDeleteAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedUser = username.trim();
    const trimmedBio = bio.trim();

    if (!trimmedFirst) {
      setError('First name is required');
      return;
    }

    if (!trimmedUser) {
      setError('Username is required');
      return;
    }

    if (/\s/.test(trimmedUser)) {
      setError('Username cannot contain spaces');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('firstName', trimmedFirst);
      formData.append('lastName', trimmedLast);
      formData.append('username', trimmedUser);
      formData.append('bio', trimmedBio);

      if (avatarFile) {
        formData.append('profilePicture', avatarFile);
      } else if (deleteAvatar) {
        formData.append('deleteProfilePicture', 'true');
      }

      const result = await updateProfileMutation(formData).unwrap();

      // Sync auth state in Redux
      dispatch(
        updateUser({
          firstName: result.firstName,
          lastName: result.lastName,
          username: result.username,
          bio: result.bio,
          profilePicture: result.profilePicture,
        })
      );

      showToast('Profile updated successfully', 'success');
      onClose();
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err?.data?.message || err?.message || 'Failed to update profile. Please try again.');
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brd bg-card">
          <div className="flex items-center gap-2">
            <User size={20} style={{ color: accentColor }} />
            <h2 className="text-lg font-bold font-space text-txt">Edit Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-txt-muted hover:text-txt hover:bg-elevated transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
            <div className="relative group shrink-0">
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-brd shadow-md flex items-center justify-center bg-elevated cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-2xl font-space"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    {(firstName?.[0] || username?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                {/* Overlay hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-white gap-1">
                  <Camera size={20} />
                  <span className="text-[10px] font-semibold">Change</span>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <p className="text-xs font-semibold text-txt">Profile Photo</p>
              <p className="text-[11px] text-txt-muted">Recommended: Square JPG, PNG, or WebP. Max 5MB.</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-elevated hover:bg-brd text-txt transition-colors border border-brd"
                >
                  Upload New
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Names Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-txt-sec mb-1.5">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={firstNameInputRef}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={40}
                required
                placeholder="e.g. Maya"
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-txt text-sm focus:outline-none focus:border-primary transition-colors font-medium placeholder:text-txt-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-txt-sec mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={40}
                placeholder="e.g. Lin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-txt text-sm focus:outline-none focus:border-primary transition-colors font-medium placeholder:text-txt-muted"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-txt-sec mb-1.5">
              Username <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-txt-muted text-sm font-space">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                maxLength={30}
                required
                placeholder="username"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-txt text-sm focus:outline-none focus:border-primary transition-colors font-space placeholder:text-txt-muted"
              />
            </div>
            <p className="text-[11px] text-txt-muted mt-1">Unique handle with no spaces. This is your public identity.</p>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-txt-sec">Bio</label>
              <span className="text-[11px] text-txt-muted">{bio.length}/200</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="Tell listeners what genres, rhythms, or sounds inspire you..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-brd text-txt text-sm focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-txt-muted leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brd">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-txt-sec hover:text-txt hover:bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-space flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: accentColor,
                color: accentTextColor,
              }}
            >
              {isUpdating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

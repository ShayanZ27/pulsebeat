import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Edit3,
  Share2,
  Calendar,
  Sparkles,
  Music2,
  Heart,
  Disc,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Radio,
  Headphones,
  History,
  ChevronDown,
} from 'lucide-react';
import {
  useGetUserProfileQuery,
  useGetUserPlaylistsQuery,
  useGetLikedMusicQuery,
  useGetLikedAlbumsQuery,
  useRecordPlayMutation,
} from '../store/api';
import { selectCurrentUser } from '../store/authSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';
import { playSingleTrack, playTracks, selectCurrentTrack, selectIsPlaying } from '../store/playerSlice';
import { getDisplayName, getInitials, formatTime } from '../utils/format';
import { showToast } from '../utils/toast';
import EditProfileModal from '../components/profile/EditProfileModal';
import ArtistRequestModal from '../components/profile/ArtistRequestModal';
import CreatePlaylistModal from '../components/common/CreatePlaylistModal';
import TrackActionMenu from '../components/common/TrackActionMenu';
import { PlayingHeartbeat } from '../components/common/PulseAnimations';

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const localUser = useSelector(selectCurrentUser);
  const { data: profileData, isLoading: loadingProfile, refetch: refetchProfile } = useGetUserProfileQuery();
  const { data: userPlaylists = [], isLoading: loadingPlaylists } = useGetUserPlaylistsQuery();
  const { data: rawLikedSongs = [], isLoading: loadingLikes } = useGetLikedMusicQuery();
  const { data: rawLikedAlbums = [], isLoading: loadingAlbums } = useGetLikedAlbumsQuery();
  const [recordPlay] = useRecordPlayMutation();

  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists' | 'liked-songs' | 'liked-albums'
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Merge server profile data with local auth user
  const user = profileData || localUser;
  const artistRequest = profileData?.artistRequest;
  const artistRequests = profileData?.artistRequests || (artistRequest ? [artistRequest] : []);

  // Liked items normalized (explicitly mark isLiked: true)
  const likedSongs = (rawLikedSongs || [])
    .map((item) => {
      const song = item.targetId || item;
      return song && song._id ? { ...song, isLiked: true } : null;
    })
    .filter(Boolean);

  const likedAlbums = (rawLikedAlbums || [])
    .map((item) => {
      const album = item.targetId || item;
      return album && album._id ? { ...album, isLiked: true } : null;
    })
    .filter(Boolean);

  const displayName = getDisplayName(user, 'PulseBeat Listener');
  const initials = getInitials(displayName);

  const formatJoined = (dateString) => {
    if (!dateString) return 'October 2026';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'October 2026';
    }
  };

  const formatRequestDate = (dateString) => {
    if (!dateString) return 'recently';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'recently';
    }
  };

  // Check 24 hour cooldown for artist request and calculate exact remaining time
  const [now, setNow] = useState(Date.now());

  // Update cooldown timer every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getCooldownRemaining = () => {
    if (!artistRequest?.createdAt) return null;
    const requestTime = new Date(artistRequest.createdAt).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const remainingMs = twentyFourHours - (now - requestTime);
    if (remainingMs <= 0) return null;

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${Math.max(minutes, 1)}m`;
  };

  const cooldownRemaining = getCooldownRemaining();

  const handleShareProfile = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Profile link copied to clipboard!', 'success');
    } else {
      showToast(`Profile: ${url}`, 'info');
    }
  };

  const handlePlaySong = (song, index) => {
    dispatch(playTracks(likedSongs, index));
    if (song?._id && !String(song._id).startsWith('sample-')) {
      recordPlay(song._id).catch(() => {});
    }
  };

  const handlePlayCollection = (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    dispatch(playTracks(tracks, startIndex));
    const firstSong = tracks[startIndex];
    if (firstSong?._id && !String(firstSong._id).startsWith('sample-')) {
      recordPlay(firstSong._id).catch(() => {});
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-28">
      {/* ─── Hero / Header Banner ─── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-card via-card/90 to-bg border-b border-brd">
        {/* Ambient Glow */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8">
            {/* Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div
                className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-brd shadow-2xl bg-elevated flex items-center justify-center cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => setShowEditModal(true)}
                title="Change profile photo"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-3xl md:text-4xl font-space"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    {initials}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-white gap-1">
                  <Edit3 size={22} />
                  <span className="text-[11px] font-semibold font-space">Edit Photo</span>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Role Badge */}
              <div className="flex items-center gap-2.5">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold font-space flex items-center gap-1.5 shadow-sm border border-brd"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    color: accentColor,
                    borderColor: `${accentColor}40`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                  {user?.role === 'artist' ? 'Verified Artist' : 'Listener'}
                </span>
                <span className="text-xs text-txt-muted flex items-center gap-1">
                  <Calendar size={13} />
                  Listening since {formatJoined(user?.createdAt)}
                </span>
              </div>

              {/* Names & Handle */}
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold font-space text-txt tracking-tight truncate">
                  {displayName}
                </h1>
                <p className="text-sm font-space text-txt-sec">@{user?.username || 'listener'}</p>
              </div>

              {/* Bio */}
              {user?.bio ? (
                <p className="text-sm text-txt-sec max-w-2xl leading-relaxed italic border-l-2 pl-3 border-brd">
                  "{user.bio}"
                </p>
              ) : (
                <p className="text-xs text-txt-muted flex items-center gap-1.5">
                  No bio yet.{' '}
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="hover:underline font-medium"
                    style={{ color: accentColor }}
                  >
                    Add a bio
                  </button>
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-space flex items-center gap-2 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm hover:border-primary active:scale-[0.98]"
                >
                  <Edit3 size={14} />
                  Edit Profile
                </button>
                <button
                  onClick={handleShareProfile}
                  className="px-4 py-2 rounded-xl text-xs font-semibold font-space flex items-center gap-2 border border-brd bg-card hover:bg-elevated text-txt-sec hover:text-txt transition-all shadow-sm active:scale-[0.98]"
                  title="Share profile"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            </div>

            {/* Quick Stat Counters */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 w-full md:w-auto p-4 rounded-2xl bg-card/70 border border-brd backdrop-blur-md">
              <div className="text-center px-2">
                <p className="text-lg md:text-xl font-extrabold font-space text-txt">
                  {userPlaylists.length}
                </p>
                <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Playlists</p>
              </div>
              <div className="text-center px-2 border-x border-brd">
                <p className="text-lg md:text-xl font-extrabold font-space text-txt">
                  {likedSongs.length}
                </p>
                <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Liked</p>
              </div>
              <div className="text-center px-2">
                <p className="text-lg md:text-xl font-extrabold font-space text-txt">
                  {likedAlbums.length}
                </p>
                <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Albums</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* ─── "Become an Artist" Studio Card ─── */}
        {user?.role === 'artist' ? (
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-card via-elevated to-card border border-brd">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
              >
                <ShieldCheck size={26} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-space text-txt">Artist Status Active</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Approved
                  </span>
                </div>
                <p className="text-xs text-txt-sec mt-0.5">
                  Your account is registered with artist privileges on PulseBeat.
                </p>
              </div>
            </div>
          </div>
        ) : artistRequest?.status === 'pending' ? (
          <div className="relative overflow-hidden rounded-2xl p-6 bg-card border border-amber-400/60 dark:border-amber-500/30 shadow-lg">
            <div
              className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 dark:opacity-15 pointer-events-none bg-amber-400"
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-500/30">
                  <Clock size={24} className="animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold font-space text-txt">
                      Artist Application Under Review
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/30 font-space">
                      In Review
                    </span>
                  </div>
                  <p className="text-xs text-txt-sec mt-1">
                    Submitted on {formatRequestDate(artistRequest.createdAt)}. Our curation team is
                    currently evaluating your request.
                  </p>
                  {artistRequest.statement && (
                    <div className="mt-3 p-3 rounded-xl bg-elevated/80 border border-brd text-xs text-txt-sec italic max-w-xl">
                      "{artistRequest.statement}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : artistRequest?.status === 'rejected' && cooldownRemaining ? (
          <div className="relative overflow-hidden rounded-2xl p-6 bg-card border border-red-500/25 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-red-500/15 text-red-400 border border-red-500/30">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold font-space text-txt">
                      Artist Application Not Approved
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-space">
                      Revision Needed
                    </span>
                  </div>
                  <p className="text-xs text-txt-sec mt-1">
                    {artistRequest.rejectionReason
                      ? `Reason: ${artistRequest.rejectionReason}`
                      : 'Your previous request was not approved. You can submit an updated request.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowArtistModal(true)}
                disabled={Boolean(cooldownRemaining)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold font-space flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed shrink-0"
                style={{
                  backgroundColor: accentColor,
                  color: accentTextColor,
                }}
              >
                <Sparkles size={14} />
                Cooldown ({cooldownRemaining})
              </button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-card via-elevated/70 to-card border border-brd shadow-xl">
            {/* Ambient accent blob */}
            <div
              className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: accentColor }}
            />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                  >
                    <Sparkles size={15} />
                  </span>
                  <span className="text-xs font-bold font-space uppercase tracking-wider" style={{ color: accentColor }}>
                    PulseBeat for Creators
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold font-space text-txt">
                  Are you a musician, producer, or audio creator?
                </h2>
                <p className="text-xs md:text-sm text-txt-sec leading-relaxed">
                  Apply for Artist Status to publish original tracks, manage your discography, and share
                  your sonic creations with the entire PulseBeat community.
                </p>

                {/* If previously rejected and cooldown ended */}
                {artistRequest?.status === 'rejected' && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300/90 dark:border-amber-500/25 text-xs text-amber-950 dark:text-amber-200 font-medium shadow-xs">
                    <CheckCircle2 size={16} className="text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>
                      Cooldown ended — you are eligible to submit a revised application!
                    </span>
                  </div>
                )}

                {/* Feature Pills */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-brd text-[11px] font-medium text-txt">
                    <Music2 size={13} style={{ color: accentColor }} />
                    Publish original music
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-brd text-[11px] font-medium text-txt">
                    <Radio size={13} style={{ color: accentColor }} />
                    Verified creator badge
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-brd text-[11px] font-medium text-txt">
                    <Headphones size={13} style={{ color: accentColor }} />
                    Reach global listeners
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowArtistModal(true)}
                className="px-6 py-3.5 rounded-2xl text-xs md:text-sm font-bold font-space flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  color: accentTextColor,
                }}
              >
                <Sparkles size={16} />
                {artistRequest?.status === 'rejected' ? 'Reapply for Artist Status' : 'Apply for Artist Status'}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Application History Accordion (Option 1) ─── */}
        {artistRequests.length > 0 && user?.role !== 'artist' && (
          <div className="p-4 rounded-2xl bg-card border border-brd shadow-sm space-y-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-xs font-bold font-space text-txt hover:text-primary transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <History size={15} style={{ color: accentColor }} />
                <span>Application History ({artistRequests.length})</span>
                <span className="text-[11px] font-normal text-txt-muted hidden sm:inline">
                  — view feedback and previous statements
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-txt-muted group-hover:text-txt transition-transform duration-200 ${
                  showHistory ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>

            {showHistory && (
              <div className="pt-2 space-y-3 border-t border-brd/60 animate-fade-in">
                {artistRequests.map((req, idx) => (
                  <div
                    key={req._id || idx}
                    className="p-3.5 rounded-xl bg-elevated/70 border border-brd text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-space border ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-300/80 dark:border-emerald-500/30'
                              : req.status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-400 border-red-300/80 dark:border-red-500/30'
                              : 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-500/30'
                          }`}
                        >
                          {req.status === 'approved'
                            ? 'Approved'
                            : req.status === 'rejected'
                            ? 'Needs Revision'
                            : 'In Review'}
                        </span>
                        <span className="text-[11px] text-txt-muted">
                          {formatRequestDate(req.createdAt)}
                        </span>
                      </div>
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider">
                          Latest Attempt
                        </span>
                      )}
                    </div>

                    <div className="text-txt-sec leading-relaxed italic bg-card/70 p-2.5 rounded-lg border border-brd/40">
                      "{req.statement}"
                    </div>

                    {req.status === 'rejected' && req.rejectionReason && (
                      <div className="text-[11px] text-red-400 flex items-start gap-1.5 pt-0.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span><strong>Admin Note:</strong> {req.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Music Collection Tabs ─── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-brd pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('playlists')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                  activeTab === 'playlists'
                    ? 'bg-elevated text-txt shadow-sm border border-brd'
                    : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                }`}
                style={activeTab === 'playlists' ? { borderColor: `${accentColor}40` } : {}}
              >
                Playlists ({userPlaylists.length})
              </button>
              <button
                onClick={() => setActiveTab('liked-songs')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                  activeTab === 'liked-songs'
                    ? 'bg-elevated text-txt shadow-sm border border-brd'
                    : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                }`}
                style={activeTab === 'liked-songs' ? { borderColor: `${accentColor}40` } : {}}
              >
                Favorite Songs ({likedSongs.length})
              </button>
              <button
                onClick={() => setActiveTab('liked-albums')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                  activeTab === 'liked-albums'
                    ? 'bg-elevated text-txt shadow-sm border border-brd'
                    : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                }`}
                style={activeTab === 'liked-albums' ? { borderColor: `${accentColor}40` } : {}}
              >
                Saved Albums ({likedAlbums.length})
              </button>
            </div>

            {activeTab === 'playlists' && (
              <button
                onClick={() => setShowCreatePlaylistModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-space flex items-center gap-1.5 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} style={{ color: accentColor }} />
                New Playlist
              </button>
            )}

            {activeTab === 'liked-songs' && likedSongs.length > 0 && (
              <button
                onClick={() => handlePlayCollection(likedSongs, 0)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-space flex items-center gap-1.5 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm cursor-pointer"
              >
                <Play size={13} fill="currentColor" style={{ color: accentColor }} />
                Play All
              </button>
            )}

            {activeTab === 'liked-albums' && likedAlbums.length > 0 && (
              <button
                onClick={() => {
                  const allAlbumSongs = likedAlbums.flatMap((a) => a.songs || []);
                  if (allAlbumSongs.length > 0) handlePlayCollection(allAlbumSongs, 0);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-space flex items-center gap-1.5 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm cursor-pointer"
              >
                <Play size={13} fill="currentColor" style={{ color: accentColor }} />
                Play All
              </button>
            )}
          </div>

          {/* ─── Tab Content ─── */}
          {activeTab === 'playlists' && (
            <div>
              {userPlaylists.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-brd bg-card/40 space-y-3">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-elevated text-txt-muted">
                    <Music2 size={24} />
                  </div>
                  <h4 className="text-sm font-bold font-space text-txt">No playlists yet</h4>
                  <p className="text-xs text-txt-sec max-w-sm mx-auto">
                    Create your first playlist and start assembling your favorite tracks.
                  </p>
                  <button
                    onClick={() => setShowCreatePlaylistModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-space transition-transform hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                  >
                    <Plus size={14} />
                    Create Playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {userPlaylists.map((pl) => (
                    <div
                      key={pl._id}
                      onClick={() => navigate(`/playlist/${pl._id}`)}
                      className="group p-3 rounded-2xl bg-card hover:bg-elevated border border-brd hover:border-primary/40 transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      {/* Cover */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-elevated border border-brd/50 mb-3 shadow-md">
                        {pl.coverImage ? (
                          <img
                            src={pl.coverImage}
                            alt={pl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-txt-muted bg-gradient-to-br from-card to-elevated">
                            <Music2 size={32} />
                          </div>
                        )}
                        {/* Play overlay button */}
                        {pl.songs?.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCollection(pl.songs, 0);
                            }}
                            className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-10"
                            style={{ backgroundColor: accentColor, color: accentTextColor }}
                            title="Play playlist"
                          >
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <p className="text-xs font-bold font-space text-txt truncate group-hover:text-primary transition-colors">
                        {pl.name}
                      </p>
                      <p className="text-[11px] text-txt-muted mt-0.5">
                        {pl.songs?.length || 0} {pl.songs?.length === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'liked-songs' && (
            <div>
              {likedSongs.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-brd bg-card/40 space-y-3">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-elevated text-txt-muted">
                    <Heart size={24} />
                  </div>
                  <h4 className="text-sm font-bold font-space text-txt">No liked songs yet</h4>
                  <p className="text-xs text-txt-sec max-w-sm mx-auto">
                    Explore trending releases and heart tracks to save them to your library.
                  </p>
                  <button
                    onClick={() => navigate('/discover/trending')}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-space transition-transform hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                  >
                    Explore Music
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {likedSongs.map((song, idx) => {
                    const isTrackPlaying = currentTrack?._id === song._id && isPlaying;
                    return (
                      <div
                        key={song._id || idx}
                        onClick={() => handlePlaySong(song, idx)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-brd hover:bg-elevated transition-colors cursor-pointer ${
                          currentTrack?._id === song._id ? 'bg-elevated border-brd' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="w-6 text-center text-xs font-space text-txt-muted font-medium">
                            {isTrackPlaying ? (
                              <PlayingHeartbeat size={14} color={accentColor} />
                            ) : (
                              idx + 1
                            )}
                          </span>

                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-elevated border border-brd shrink-0">
                            {song.coverImage ? (
                              <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-txt-muted">
                                <Music2 size={16} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-xs md:text-sm font-bold font-space truncate transition-colors ${
                                currentTrack?._id === song._id ? '' : 'text-txt group-hover:text-primary'
                              }`}
                              style={currentTrack?._id === song._id ? { color: accentColor } : {}}
                            >
                              {song.title}
                            </p>
                            <p className="text-[11px] text-txt-muted truncate">
                              {song.artist?.name || song.artist?.username || 'Unknown Artist'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-space text-txt-muted hidden sm:inline">
                            {formatTime(song.duration)}
                          </span>
                          <TrackActionMenu item={song} track={song} itemType="track" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'liked-albums' && (
            <div>
              {likedAlbums.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-brd bg-card/40 space-y-3">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-elevated text-txt-muted">
                    <Disc size={24} />
                  </div>
                  <h4 className="text-sm font-bold font-space text-txt">No saved albums</h4>
                  <p className="text-xs text-txt-sec max-w-sm mx-auto">
                    Browse the latest album releases and save your favorites here.
                  </p>
                  <button
                    onClick={() => navigate('/discover/top-albums')}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-space transition-transform hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                  >
                    Browse Albums
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {likedAlbums.map((album) => (
                    <div
                      key={album._id}
                      onClick={() => navigate(`/album/${album._id}`)}
                      className="group p-3 rounded-2xl bg-card hover:bg-elevated border border-brd hover:border-primary/40 transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-elevated border border-brd/50 mb-3 shadow-md">
                        {album.coverImage ? (
                          <img
                            src={album.coverImage}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-txt-muted bg-gradient-to-br from-card to-elevated">
                            <Disc size={32} />
                          </div>
                        )}
                        {album.songs?.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCollection(album.songs, 0);
                            }}
                            className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-10"
                            style={{ backgroundColor: accentColor, color: accentTextColor }}
                            title="Play album"
                          >
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-bold font-space text-txt truncate group-hover:text-primary transition-colors">
                        {album.title}
                      </p>
                      <p className="text-[11px] text-txt-muted mt-0.5 truncate">
                        {album.artist?.name || album.artist?.username || 'Album'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
        />
      )}

      {showArtistModal && (
        <ArtistRequestModal
          isOpen={showArtistModal}
          onClose={() => setShowArtistModal(false)}
          onSubmitted={() => refetchProfile()}
          previousFeedback={artistRequest?.rejectionReason || null}
        />
      )}

      {showCreatePlaylistModal && (
        <CreatePlaylistModal
          isOpen={showCreatePlaylistModal}
          onClose={() => setShowCreatePlaylistModal(false)}
        />
      )}
    </div>
  );
}

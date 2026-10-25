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
  Upload,
  Eye,
  EyeOff,
  ShieldAlert,
  ExternalLink,
  Flag,
  BadgeCheck,
} from 'lucide-react';
import {
  useGetUserProfileQuery,
  useGetUserPlaylistsQuery,
  useGetLikedMusicQuery,
  useGetLikedAlbumsQuery,
  useGetArtistMusicQuery,
  useGetArtistAlbumsQuery,
  useToggleMusicVisibilityMutation,
  useToggleAlbumVisibilityMutation,
  useRecordPlayMutation,
  useGetAdminFeaturedQuery,
  useGetAdminReportsQuery,
  useGetAdminArtistRequestsQuery,
  useGetAdminSuspendedQuery,
} from '../store/api';
import { selectCurrentUser } from '../store/authSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';
import { playTracks, selectCurrentTrack, selectIsPlaying } from '../store/playerSlice';
import { getDisplayName, getInitials, formatTime } from '../utils/format';
import { showToast } from '../utils/toast';
import EditProfileModal from '../components/profile/EditProfileModal';
import ArtistRequestModal from '../components/profile/ArtistRequestModal';
import UploadTrackModal from '../components/profile/UploadTrackModal';
import CreateAlbumModal from '../components/profile/CreateAlbumModal';
import CreatePlaylistModal from '../components/common/CreatePlaylistModal';
import TrackActionMenu from '../components/common/TrackActionMenu';
import { PlayingHeartbeat } from '../components/common/PulseAnimations';
import AdminFeaturedTab from '../components/admin/AdminFeaturedTab';
import AdminReportsTab from '../components/admin/AdminReportsTab';
import AdminArtistRequestsTab from '../components/admin/AdminArtistRequestsTab';
import AdminSuspendedTab from '../components/admin/AdminSuspendedTab';

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const localUser = useSelector(selectCurrentUser);
  const { data: profileData, isLoading: loadingProfile, refetch: refetchProfile } = useGetUserProfileQuery();
  const [recordPlay] = useRecordPlayMutation();

  // Merge server profile data with local auth user
  const user = profileData || localUser;
  const isArtist = user?.role === 'artist';
  const isAdmin = user?.role === 'admin';

  // Listener data (skipped for artists & admins)
  const { data: userPlaylists = [], isLoading: loadingPlaylists } = useGetUserPlaylistsQuery(undefined, { skip: isArtist || isAdmin });
  const { data: rawLikedSongs = [], isLoading: loadingLikes } = useGetLikedMusicQuery(undefined, { skip: isArtist || isAdmin });
  const { data: rawLikedAlbums = [], isLoading: loadingAlbums } = useGetLikedAlbumsQuery(undefined, { skip: isArtist || isAdmin });

  // Artist data (skipped for listeners)
  const {
    data: artistMusic = [],
    isLoading: loadingArtistMusic,
    refetch: refetchArtistMusic,
  } = useGetArtistMusicQuery(user?._id, { skip: !isArtist || !user?._id });

  const {
    data: artistAlbums = [],
    isLoading: loadingArtistAlbums,
    refetch: refetchArtistAlbums,
  } = useGetArtistAlbumsQuery(user?._id, { skip: !isArtist || !user?._id });

  const [toggleMusicVisibility] = useToggleMusicVisibilityMutation();
  const [toggleAlbumVisibility] = useToggleAlbumVisibilityMutation();

  // UI state
  const [listenerTab, setListenerTab] = useState('playlists'); // 'playlists' | 'liked-songs' | 'liked-albums'
  const [artistTab, setArtistTab] = useState('tracks'); // 'tracks' | 'albums'
  const [adminTab, setAdminTab] = useState('featured'); // 'featured' | 'reports' | 'artist-requests' | 'suspended'

  // Admin data queries (only active when isAdmin)
  const { data: adminFeatured = [] } = useGetAdminFeaturedQuery(undefined, { skip: !isAdmin });
  const { data: adminReports = [] } = useGetAdminReportsQuery({ status: 'open' }, { skip: !isAdmin });
  const { data: adminRequests = [] } = useGetAdminArtistRequestsQuery({ status: 'pending' }, { skip: !isAdmin });
  const { data: adminSuspended = { tracks: [], albums: [], artists: [] } } = useGetAdminSuspendedQuery(undefined, { skip: !isAdmin });

  const pendingReportsCount = (adminReports || []).filter((r) => r.status === 'pending').length;
  const pendingRequestsCount = (adminRequests || []).filter((r) => r.status === 'pending').length;
  const suspendedTracksCount = adminSuspended?.tracks?.length || 0;
  const suspendedAlbumsCount = adminSuspended?.albums?.length || 0;
  const suspendedArtistsCount = adminSuspended?.artists?.length || 0;
  const totalSuspendedCount = suspendedTracksCount + suspendedAlbumsCount + suspendedArtistsCount;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // First-time artist approved banner dismissal
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    if (!user?._id) return false;
    return localStorage.getItem(`pulsebeat_artist_approved_banner_${user._id}`) === 'true';
  });

  useEffect(() => {
    if (user?._id) {
      const dismissed = localStorage.getItem(`pulsebeat_artist_approved_banner_${user._id}`) === 'true';
      setWelcomeDismissed(dismissed);
    }
  }, [user?._id]);

  const handleDismissWelcome = () => {
    if (user?._id) {
      localStorage.setItem(`pulsebeat_artist_approved_banner_${user._id}`, 'true');
      setWelcomeDismissed(true);
    }
  };

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

  const displayName = getDisplayName(user, isArtist ? 'PulseBeat Artist' : 'PulseBeat Listener');
  const initials = getInitials(displayName);

  // Artist aggregate statistics
  const totalArtistPlays = (artistMusic || []).reduce((sum, track) => sum + (track.plays || 0), 0);

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

  // Cooldown logic for pending/rejected requests
  const [now, setNow] = useState(Date.now());
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

    if (hours > 0) return `${hours}h ${minutes}m`;
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

  const handlePlayCollection = (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    dispatch(playTracks(tracks, startIndex));
    const firstSong = tracks[startIndex];
    if (firstSong?._id && !String(firstSong._id).startsWith('sample-')) {
      recordPlay(firstSong._id).catch(() => {});
    }
  };

  // Artist Visibility Handlers
  const handleToggleMusicVisibility = async (e, track) => {
    e.stopPropagation();
    if (track.isSuspended) {
      showToast('This track has been suspended by administration and cannot be modified.', 'error');
      return;
    }
    try {
      const res = await toggleMusicVisibility(track._id).unwrap();
      showToast(res.message || 'Track visibility updated', 'success');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to update visibility', 'error');
    }
  };

  const handleToggleAlbumVisibility = async (e, album) => {
    e.stopPropagation();
    if (album.isSuspended) {
      showToast('This album has been suspended by administration and cannot be modified.', 'error');
      return;
    }
    try {
      const res = await toggleAlbumVisibility(album._id).unwrap();
      showToast(res.message || 'Album visibility updated', 'success');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to update visibility', 'error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-28">
      {/* ─── Hero / Header Banner ─── */}
      <div className="relative overflow-hidden bg-linear-to-b from-card via-card/90 to-bg border-b border-brd">
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
              <div className="flex items-center gap-2.5 flex-wrap">
                {isAdmin ? (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold font-space flex items-center gap-1.5 shadow-sm border border-red-500/30 bg-red-500/15 text-red-400">
                    <ShieldCheck size={14} className="text-red-400" />
                    System Administrator
                  </span>
                ) : user?.isSuspended ? (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold font-space flex items-center gap-1.5 shadow-sm border border-red-500/40 bg-red-500/20 text-red-400">
                    <ShieldAlert size={14} className="text-red-400" />
                    Creator Account Suspended
                  </span>
                ) : (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold font-space flex items-center gap-1.5 shadow-sm border border-brd"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                      borderColor: `${accentColor}40`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                    {isArtist ? 'Verified Artist Creator' : 'Listener'}
                  </span>
                )}
                <span className="text-xs text-txt-muted flex items-center gap-1">
                  <Calendar size={13} />
                  {isAdmin ? 'Admin since' : isArtist ? 'Creator since' : 'Listening since'} {formatJoined(user?.createdAt)}
                </span>
              </div>

              {/* Names & Handle */}
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold font-space text-txt tracking-tight truncate">
                  {displayName}
                </h1>
                <p className="text-sm font-space text-txt-sec">@{user?.username || (isArtist ? 'artist' : 'listener')}</p>
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
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold font-space flex items-center gap-2 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm hover:border-primary active:scale-[0.98] cursor-pointer"
                >
                  <Edit3 size={14} />
                  Edit Profile
                </button>

                {isArtist && (
                  <button
                    onClick={() => navigate(`/artist/${user._id}`)}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-space flex items-center gap-2 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm hover:border-primary active:scale-[0.98] cursor-pointer"
                    title="View public artist profile as seen by listeners"
                  >
                    <ExternalLink size={14} style={{ color: accentColor }} />
                    View Public Artist Page
                  </button>
                )}

                <button
                  onClick={handleShareProfile}
                  className="px-4 py-2 rounded-xl text-xs font-semibold font-space flex items-center gap-2 border border-brd bg-card hover:bg-elevated text-txt-sec hover:text-txt transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  title="Share profile"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            </div>

            {/* Quick Stat Counters */}
            {isAdmin ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full md:w-auto p-4 rounded-2xl bg-card/70 border border-brd backdrop-blur-md">
                <div
                  className="text-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setAdminTab('featured')}
                >
                  <p className="text-lg md:text-xl font-extrabold font-space" style={{ color: accentColor }}>
                    {adminFeatured.length}
                  </p>
                  <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Featured</p>
                </div>
                <div
                  className="text-center px-2 border-l sm:border-x border-brd cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setAdminTab('reports')}
                >
                  <p className="text-lg md:text-xl font-extrabold font-space text-amber-400">
                    {pendingReportsCount}
                  </p>
                  <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Reports</p>
                </div>
                <div
                  className="text-center px-2 border-t sm:border-t-0 sm:border-r border-brd pt-2 sm:pt-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setAdminTab('artist-requests')}
                >
                  <p className="text-lg md:text-xl font-extrabold font-space text-emerald-400">
                    {pendingRequestsCount}
                  </p>
                  <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Requests</p>
                </div>
                <div
                  className="text-center px-2 border-t sm:border-t-0 border-l sm:border-l-0 border-brd pt-2 sm:pt-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setAdminTab('suspended')}
                >
                  <p className="text-lg md:text-xl font-extrabold font-space text-red-400">
                    {totalSuspendedCount}
                  </p>
                  <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Suspended</p>
                </div>
              </div>
            ) : isArtist ? (
              <div className="grid grid-cols-3 gap-3 md:gap-4 w-full md:w-auto p-4 rounded-2xl bg-card/70 border border-brd backdrop-blur-md">
                <div className="text-center px-2">
                  <p className="text-lg md:text-xl font-extrabold font-space text-txt">
                    {artistMusic.length}
                  </p>
                  <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Tracks</p>
                </div>
                <div className="text-center px-2 border-x border-brd">
                  <p className="text-lg md:text-xl font-extrabold font-space text-txt">
                    {artistAlbums.length}
                  </p>
                  <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Albums</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-lg md:text-xl font-extrabold font-space text-txt">
                    {totalArtistPlays.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-medium text-txt-muted uppercase tracking-wider">Total Plays</p>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Creator Account Suspension Alert */}
        {user?.isSuspended && (
          <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-start gap-4 text-red-400 shadow-sm animate-in fade-in duration-300">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} className="text-red-400" />
            </div>
            <div className="space-y-1.5 text-xs font-space flex-1">
              <h4 className="font-bold text-sm text-red-300">Creator Account Suspended by Administration</h4>
              <p className="text-red-300/80 leading-relaxed text-xs">
                Your artist privileges have been temporarily suspended. Your public artist profile and discography are currently withheld from global discovery, search, and charts. You can continue listening to music as normal, but uploading new tracks or creating albums is disabled.
              </p>
            </div>
          </div>
        )}
        {/* ══════════════════════════════════════════════════════
            ADMIN DASHBOARD VIEW
        ══════════════════════════════════════════════════════ */}
        {isAdmin ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Admin Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brd pb-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setAdminTab('featured')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'featured'
                      ? 'bg-elevated text-txt shadow-sm border border-brd'
                      : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                  }`}
                  style={adminTab === 'featured' ? { borderColor: `${accentColor}40`, color: accentColor } : {}}
                >
                  <Sparkles size={16} />
                  <span>Featured Content</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-sidebar border border-brd font-mono">
                    {adminFeatured.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('reports')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'reports'
                      ? 'bg-elevated text-txt shadow-sm border border-brd'
                      : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                  }`}
                  style={adminTab === 'reports' ? { borderColor: `${accentColor}40`, color: accentColor } : {}}
                >
                  <Flag size={16} />
                  <span>Reports & Moderation</span>
                  {pendingReportsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                      {pendingReportsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('artist-requests')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'artist-requests'
                      ? 'bg-elevated text-txt shadow-sm border border-brd'
                      : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                  }`}
                  style={adminTab === 'artist-requests' ? { borderColor: `${accentColor}40`, color: accentColor } : {}}
                >
                  <BadgeCheck size={16} />
                  <span>Artist Requests</span>
                  {pendingRequestsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('suspended')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'suspended'
                      ? 'bg-elevated text-txt shadow-sm border border-brd'
                      : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                  }`}
                  style={adminTab === 'suspended' ? { borderColor: `${accentColor}40`, color: accentColor } : {}}
                >
                  <ShieldAlert size={16} />
                  <span>Suspended Items</span>
                  {totalSuspendedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                      {totalSuspendedCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Admin Tab Content */}
            {adminTab === 'featured' && (
              <AdminFeaturedTab accentColor={accentColor} accentTextColor={accentTextColor} />
            )}
            {adminTab === 'reports' && (
              <AdminReportsTab accentColor={accentColor} accentTextColor={accentTextColor} />
            )}
            {adminTab === 'artist-requests' && (
              <AdminArtistRequestsTab accentColor={accentColor} accentTextColor={accentTextColor} />
            )}
            {adminTab === 'suspended' && (
              <AdminSuspendedTab accentColor={accentColor} accentTextColor={accentTextColor} />
            )}
          </div>
        ) : isArtist ? (
          <div className="space-y-8">
            {/* ─── First-time Approval Banner (Dismissible) ─── */}
            {!welcomeDismissed && (
              <div className="relative overflow-hidden rounded-3xl p-6 md:p-7 bg-card border border-emerald-500/40 shadow-xl">
                <div
                  className="absolute -right-16 -top-16 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: '#10b981' }}
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base md:text-lg font-bold font-space text-txt">
                          Artist Application Approved! 🎉
                        </h3>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-space uppercase tracking-wider">
                          Welcome Creator
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-txt-sec mt-1 max-w-2xl leading-relaxed">
                        Welcome to PulseBeat Creator Studio! You now have full artist privileges. You can upload original songs, curate full albums, and manage public vs. hidden visibility for your discography right from this dashboard.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDismissWelcome}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold font-space bg-elevated hover:bg-bg border border-brd text-txt transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    Got it, Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* ─── Creator Studio Quick Actions Bar ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-elevated/60 to-card border border-brd shadow-sm">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <Radio size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-space text-txt">Creator Studio Hub</h3>
                  <p className="text-xs text-txt-sec">Manage your discography, releases, and catalog visibility.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (user?.isSuspended) {
                      showToast('Your creator account is suspended. You cannot upload tracks.', 'error');
                      return;
                    }
                    setShowUploadModal(true);
                  }}
                  disabled={user?.isSuspended}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-space flex items-center gap-2 shadow-lg transition-transform ${
                    user?.isSuspended
                      ? 'opacity-50 cursor-not-allowed bg-card border border-brd text-txt-muted'
                      : 'hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                  style={!user?.isSuspended ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                  title={user?.isSuspended ? 'Account suspended - uploads disabled' : 'Upload Track'}
                >
                  <Upload size={14} />
                  Upload Track
                </button>
                <button
                  onClick={() => {
                    if (user?.isSuspended) {
                      showToast('Your creator account is suspended. You cannot create albums.', 'error');
                      return;
                    }
                    setShowCreateAlbumModal(true);
                  }}
                  disabled={user?.isSuspended}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-space flex items-center gap-2 border border-brd bg-card transition-all shadow-sm ${
                    user?.isSuspended
                      ? 'opacity-50 cursor-not-allowed text-txt-muted'
                      : 'hover:bg-elevated text-txt cursor-pointer active:scale-95'
                  }`}
                  title={user?.isSuspended ? 'Account suspended - album creation disabled' : 'Create Album'}
                >
                  <Plus size={14} style={{ color: user?.isSuspended ? undefined : accentColor }} />
                  Create Album
                </button>
              </div>
            </div>

            {/* ─── Artist Discography Tabs ─── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brd pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setArtistTab('tracks')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                      artistTab === 'tracks'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                    }`}
                    style={artistTab === 'tracks' ? { borderColor: `${accentColor}40` } : {}}
                  >
                    Uploaded Tracks ({artistMusic.length})
                  </button>
                  <button
                    onClick={() => setArtistTab('albums')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                      artistTab === 'albums'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                    }`}
                    style={artistTab === 'albums' ? { borderColor: `${accentColor}40` } : {}}
                  >
                    Albums ({artistAlbums.length})
                  </button>
                </div>

                {artistTab === 'tracks' && artistMusic.length > 0 && (
                  <button
                    onClick={() => handlePlayCollection(artistMusic, 0)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-space flex items-center gap-1.5 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" style={{ color: accentColor }} />
                    Play All
                  </button>
                )}
              </div>

              {/* ─── Tab Content: Tracks ─── */}
              {artistTab === 'tracks' && (
                <div>
                  {loadingArtistMusic ? (
                    <div className="py-16 text-center text-xs font-space text-txt-muted animate-pulse">
                      Loading your uploaded catalog...
                    </div>
                  ) : artistMusic.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-brd bg-card/40 space-y-4">
                      <div
                        className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        <Music2 size={28} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold font-space text-txt">No tracks uploaded yet</h4>
                        <p className="text-xs text-txt-sec max-w-sm mx-auto">
                          Upload your original audio files to share them with listeners across PulseBeat.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (user?.isSuspended) {
                            showToast('Your creator account is suspended. You cannot upload tracks.', 'error');
                            return;
                          }
                          setShowUploadModal(true);
                        }}
                        disabled={user?.isSuspended}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold font-space transition-transform inline-flex items-center gap-2 shadow-lg ${
                          user?.isSuspended
                            ? 'opacity-50 cursor-not-allowed bg-card border border-brd text-txt-muted'
                            : 'hover:scale-105 active:scale-95 cursor-pointer'
                        }`}
                        style={!user?.isSuspended ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                      >
                        <Upload size={14} />
                        Upload Your First Track
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {artistMusic.map((song, idx) => {
                        const isTrackPlaying = currentTrack?._id === song._id && isPlaying;
                        const isPublic = song.isActive !== false;

                        return (
                          <div
                            key={song._id || idx}
                            onClick={() => handlePlayCollection(artistMusic, idx)}
                            className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                              currentTrack?._id === song._id
                                ? 'bg-elevated border-primary/50 shadow-sm'
                                : 'bg-card hover:bg-elevated border-brd hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span className="w-6 text-center text-xs font-space text-txt-muted font-medium shrink-0">
                                {isTrackPlaying ? (
                                  <PlayingHeartbeat size={14} color={accentColor} />
                                ) : (
                                  idx + 1
                                )}
                              </span>

                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-elevated border border-brd shrink-0 shadow-xs">
                                {song.coverImage ? (
                                  <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-txt-muted">
                                    <Music2 size={18} />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-xs md:text-sm font-bold font-space truncate transition-colors ${
                                      currentTrack?._id === song._id ? '' : 'text-txt group-hover:text-primary'
                                    }`}
                                    style={currentTrack?._id === song._id ? { color: accentColor } : {}}
                                  >
                                    {song.title}
                                  </p>
                                  {/* Visibility status tag */}
                                  {song.isSuspended ? (
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[10px] font-bold font-space flex items-center gap-1 border shrink-0 bg-red-500/10 text-red-400 border-red-500/25"
                                      title="Suspended by administration due to community guidelines"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                      Suspended
                                    </span>
                                  ) : (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-space flex items-center gap-1 border shrink-0 ${
                                        isPublic
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isPublic ? 'bg-emerald-400' : 'bg-amber-400'
                                        }`}
                                      />
                                      {isPublic ? 'Public' : 'Hidden'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-txt-muted truncate mt-0.5">
                                  {song.genre || 'Music'} • {song.mood || 'Vibe'}
                                </p>
                              </div>
                            </div>

                            {/* Right side stats & management controls */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-xs font-space font-semibold text-txt">
                                  {(song.plays || 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-txt-muted">plays</p>
                              </div>

                              <span className="text-xs font-space text-txt-muted hidden md:inline">
                                {formatTime(song.duration)}
                              </span>

                              {/* Toggle Visibility */}
                              {song.isSuspended ? (
                                <button
                                  type="button"
                                  disabled
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 rounded-xl border opacity-40 cursor-not-allowed bg-elevated border-brd text-txt-muted"
                                  title="Suspended by administration due to community guidelines"
                                >
                                  <ShieldAlert size={15} className="text-red-400" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleMusicVisibility(e, song)}
                                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                    isPublic
                                      ? 'bg-elevated hover:bg-bg border-brd text-txt-sec hover:text-txt'
                                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                                  }`}
                                  title={isPublic ? 'Publicly visible: click to hide' : 'Hidden from public: click to make visible'}
                                >
                                  {isPublic ? <Eye size={15} /> : <EyeOff size={15} />}
                                </button>
                              )}

                              <TrackActionMenu item={song} track={song} itemType="track" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─── Tab Content: Albums ─── */}
              {artistTab === 'albums' && (
                <div>
                  {loadingArtistAlbums ? (
                    <div className="py-16 text-center text-xs font-space text-txt-muted animate-pulse">
                      Loading your albums...
                    </div>
                  ) : artistAlbums.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-brd bg-card/40 space-y-4">
                      <div
                        className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        <Disc size={28} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold font-space text-txt">No albums created yet</h4>
                        <p className="text-xs text-txt-sec max-w-sm mx-auto">
                          Bundle your uploaded songs into an official album release for listeners to enjoy.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (user?.isSuspended) {
                            showToast('Your creator account is suspended. You cannot create albums.', 'error');
                            return;
                          }
                          setShowCreateAlbumModal(true);
                        }}
                        disabled={user?.isSuspended}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold font-space transition-transform inline-flex items-center gap-2 shadow-lg ${
                          user?.isSuspended
                            ? 'opacity-50 cursor-not-allowed bg-card border border-brd text-txt-muted'
                            : 'hover:scale-105 active:scale-95 cursor-pointer'
                        }`}
                        style={!user?.isSuspended ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                      >
                        <Plus size={14} />
                        Create Your First Album
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {artistAlbums.map((album) => {
                        const isPublic = album.isActive !== false;
                        const songsCount = album.songs?.length || 0;

                        return (
                          <div
                            key={album._id}
                            className="group p-4 rounded-2xl bg-card hover:bg-elevated border border-brd hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
                          >
                            <div>
                              {/* Cover */}
                              <div
                                onClick={() => navigate(`/album/${album._id}`)}
                                className="relative aspect-square rounded-xl overflow-hidden bg-elevated border border-brd/50 mb-3 shadow-md cursor-pointer"
                              >
                                {album.coverImage ? (
                                  <img
                                    src={album.coverImage}
                                    alt={album.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-txt-muted bg-gradient-to-br from-card to-elevated">
                                    <Disc size={36} />
                                  </div>
                                )}

                                {/* Status Tag Overlay */}
                                <div className="absolute top-2.5 left-2.5 z-10">
                                  {album.isSuspended ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-space flex items-center gap-1 shadow-md backdrop-blur-md border bg-black/60 text-red-400 border-red-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                      Suspended
                                    </span>
                                  ) : (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-space flex items-center gap-1 shadow-md backdrop-blur-md border ${
                                        isPublic
                                          ? 'bg-black/60 text-emerald-400 border-emerald-500/30'
                                          : 'bg-black/60 text-amber-400 border-amber-500/30'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isPublic ? 'bg-emerald-400' : 'bg-amber-400'
                                        }`}
                                      />
                                      {isPublic ? 'Public' : 'Hidden'}
                                    </span>
                                  )}
                                </div>

                                {/* Play button overlay */}
                                {songsCount > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayCollection(album.songs, 0);
                                    }}
                                    className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-10 cursor-pointer"
                                    style={{ backgroundColor: accentColor, color: accentTextColor }}
                                    title="Play album"
                                  >
                                    <Play size={16} fill="currentColor" className="ml-0.5" />
                                  </button>
                                )}
                              </div>

                              {/* Title and description */}
                              <h4
                                onClick={() => navigate(`/album/${album._id}`)}
                                className="text-sm font-bold font-space text-txt truncate group-hover:text-primary transition-colors cursor-pointer"
                              >
                                {album.title}
                              </h4>
                              <p className="text-[11px] text-txt-muted line-clamp-1 mt-0.5">
                                {album.description || `${songsCount} songs`}
                              </p>
                              <p className="text-[10px] font-space text-txt-muted mt-1">
                                {songsCount} {songsCount === 1 ? 'song' : 'songs'} • {(album.plays || 0).toLocaleString()} plays
                              </p>
                            </div>

                            {/* Album card bottom controls */}
                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-brd/60">
                              <button
                                onClick={() => navigate(`/album/${album._id}`)}
                                className="text-xs font-space font-semibold text-txt-sec hover:text-txt flex items-center gap-1 cursor-pointer"
                              >
                                View Album <ArrowRight size={12} />
                              </button>

                              <div className="flex items-center gap-1.5">
                                {album.isSuspended ? (
                                  <button
                                    type="button"
                                    disabled
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2.5 py-1.5 rounded-lg border text-[11px] font-space font-semibold opacity-40 cursor-not-allowed flex items-center gap-1.5 bg-elevated border-brd text-txt-muted"
                                    title="Suspended by administration due to community guidelines"
                                  >
                                    <ShieldAlert size={13} className="text-red-400" />
                                    <span>Suspended</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleAlbumVisibility(e, album)}
                                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-space font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                      isPublic
                                        ? 'bg-elevated hover:bg-bg border-brd text-txt-sec hover:text-txt'
                                        : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                                    }`}
                                    title={isPublic ? 'Public: click to hide' : 'Hidden: click to make visible'}
                                  >
                                    {isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
                                    <span>{isPublic ? 'Hide' : 'Publish'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════
              LISTENER PROFILE VIEW (Unchanged for standard users)
          ══════════════════════════════════════════════════════ */
          <>
            {/* ─── "Become an Artist" Studio Card ─── */}
            {artistRequest?.status === 'pending' ? (
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

                    {artistRequest?.status === 'rejected' && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300/90 dark:border-amber-500/25 text-xs text-amber-950 dark:text-amber-200 font-medium shadow-xs">
                        <CheckCircle2 size={16} className="text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>
                          Cooldown ended — you are eligible to submit a revised application!
                        </span>
                      </div>
                    )}

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

            {/* ─── Application History Accordion ─── */}
            {artistRequests.length > 0 && (
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

            {/* ─── Music Collection Tabs (Listener) ─── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brd pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setListenerTab('playlists')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                      listenerTab === 'playlists'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                    }`}
                    style={listenerTab === 'playlists' ? { borderColor: `${accentColor}40` } : {}}
                  >
                    Playlists ({userPlaylists.length})
                  </button>
                  <button
                    onClick={() => setListenerTab('liked-songs')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                      listenerTab === 'liked-songs'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                    }`}
                    style={listenerTab === 'liked-songs' ? { borderColor: `${accentColor}40` } : {}}
                  >
                    Favorite Songs ({likedSongs.length})
                  </button>
                  <button
                    onClick={() => setListenerTab('liked-albums')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold font-space transition-all cursor-pointer ${
                      listenerTab === 'liked-albums'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-sec hover:text-txt hover:bg-elevated/50'
                    }`}
                    style={listenerTab === 'liked-albums' ? { borderColor: `${accentColor}40` } : {}}
                  >
                    Saved Albums ({likedAlbums.length})
                  </button>
                </div>

                {listenerTab === 'playlists' && (
                  <button
                    onClick={() => setShowCreatePlaylistModal(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-space flex items-center gap-1.5 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={14} style={{ color: accentColor }} />
                    New Playlist
                  </button>
                )}

                {listenerTab === 'liked-songs' && likedSongs.length > 0 && (
                  <button
                    onClick={() => handlePlayCollection(likedSongs, 0)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-space flex items-center gap-1.5 border border-brd bg-card hover:bg-elevated text-txt transition-all shadow-sm cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" style={{ color: accentColor }} />
                    Play All
                  </button>
                )}

                {listenerTab === 'liked-albums' && likedAlbums.length > 0 && (
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

              {/* Playlists */}
              {listenerTab === 'playlists' && (
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

              {/* Liked Songs */}
              {listenerTab === 'liked-songs' && (
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
                            onClick={() => handlePlayCollection(likedSongs, idx)}
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

              {/* Liked Albums */}
              {listenerTab === 'liked-albums' && (
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
          </>
        )}
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

      {showUploadModal && (
        <UploadTrackModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => refetchArtistMusic()}
        />
      )}

      {showCreateAlbumModal && (
        <CreateAlbumModal
          isOpen={showCreateAlbumModal}
          onClose={() => setShowCreateAlbumModal(false)}
          onSuccess={() => refetchArtistAlbums()}
          availableTracks={artistMusic}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, Disc, Pause, Play, Sparkles, Star } from 'lucide-react';
import {
  useGetCommunityPlaylistsQuery,
  useGetFeaturedQuery,
  useGetLatestReleasesQuery,
  useGetRecentlyPlayedQuery,
  useGetTrendingAlbumsQuery,
  useGetTrendingArtistsQuery,
  useGetTrendingMusicQuery,
  useRecordPlayMutation,
} from '../store/api';
import { selectCurrentUser } from '../store/authSlice';
import { playSingleTrack, playTrack, playTracks, selectCurrentTrack, selectIsPlaying, togglePlay } from '../store/playerSlice';
import {
  selectAccentColor,
  selectAccentTextColor,
} from '../store/themeSlice';
import { getDisplayName, getGreeting } from '../utils/format';
import TrackActionMenu from '../components/common/TrackActionMenu';
import AddToPlaylistModal from '../components/common/AddToPlaylistModal';
import { PlayingOverlay } from '../components/common/PulseAnimations';
import FeaturedShowcase from '../components/common/FeaturedShowcase';
import HorizontalSlider from '../components/common/HorizontalSlider';

/* ─── Custom Premium SVGs (Line Art) ─── */

const HeadphonesLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    {/* Headband - thick arc with highlight */}
    <path d="M40 110 C40 45, 160 45, 160 110" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M48 110 C48 55, 152 55, 152 110" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
    {/* Headband padding/cushion at top */}
    <path d="M88 52 C88 48, 112 48, 112 52" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M85 55 L85 50 C85 44, 115 44, 115 50 L115 55" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
    {/* Left ear cup - outer shell */}
    <path d="M40 100 L40 155 C40 165, 30 168, 28 155 L28 115 C28 100, 40 98, 40 100 Z" stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    {/* Left ear cup - inner detail / cushion */}
    <path d="M38 108 L38 148 C38 156, 32 158, 31 148 L31 118 C31 108, 38 106, 38 108 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
    {/* Left driver circle */}
    <circle cx="35" cy="128" r="6" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
    <circle cx="35" cy="128" r="2.5" fill={color} opacity="0.3" />
    {/* Left cup - inner mesh lines */}
    <path d="M32 115 L38 115 M32 121 L38 121 M32 135 L38 135 M32 141 L38 141" stroke={color} strokeWidth="0.8" opacity="0.25" />
    {/* Right ear cup - outer shell */}
    <path d="M160 100 L160 155 C160 165, 170 168, 172 155 L172 115 C172 100, 160 98, 160 100 Z" stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    {/* Right ear cup - inner detail / cushion */}
    <path d="M162 108 L162 148 C162 156, 168 158, 169 148 L169 118 C169 108, 162 106, 162 108 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
    {/* Right driver circle */}
    <circle cx="165" cy="128" r="6" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
    <circle cx="165" cy="128" r="2.5" fill={color} opacity="0.3" />
    {/* Right cup - inner mesh lines */}
    <path d="M162 115 L168 115 M162 121 L168 121 M162 135 L168 135 M162 141 L168 141" stroke={color} strokeWidth="0.8" opacity="0.25" />
    {/* Left hinge/slider */}
    <path d="M40 98 L40 105" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M36 100 L44 100" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    {/* Right hinge/slider */}
    <path d="M160 98 L160 105" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M156 100 L164 100" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    {/* Cable from left cup */}
    <path d="M34 165 C34 180, 40 190, 50 195" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    <circle cx="50" cy="195" r="2" fill={color} opacity="0.3" />
  </svg>
);

const VinylDiscLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    {/* Outermost ring */}
    <circle cx="100" cy="100" r="96" stroke={color} strokeWidth="2" />
    <circle cx="100" cy="100" r="93" stroke={color} strokeWidth="0.5" opacity="0.3" />
    {/* Groove rings — many concentric circles for realism */}
    <circle cx="100" cy="100" r="88" stroke={color} strokeWidth="0.4" opacity="0.25" />
    <circle cx="100" cy="100" r="84" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <circle cx="100" cy="100" r="80" stroke={color} strokeWidth="0.4" opacity="0.2" />
    <circle cx="100" cy="100" r="76" stroke={color} strokeWidth="0.6" opacity="0.35" />
    <circle cx="100" cy="100" r="72" stroke={color} strokeWidth="0.4" opacity="0.2" />
    <circle cx="100" cy="100" r="68" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <circle cx="100" cy="100" r="64" stroke={color} strokeWidth="0.4" opacity="0.25" />
    <circle cx="100" cy="100" r="60" stroke={color} strokeWidth="0.6" opacity="0.35" />
    <circle cx="100" cy="100" r="56" stroke={color} strokeWidth="0.4" opacity="0.2" />
    <circle cx="100" cy="100" r="52" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <circle cx="100" cy="100" r="48" stroke={color} strokeWidth="0.4" opacity="0.25" />
    <circle cx="100" cy="100" r="44" stroke={color} strokeWidth="0.6" opacity="0.3" />
    <circle cx="100" cy="100" r="40" stroke={color} strokeWidth="0.4" opacity="0.2" />
    {/* Label area boundary */}
    <circle cx="100" cy="100" r="34" stroke={color} strokeWidth="1.5" opacity="0.6" />
    {/* Label inner details */}
    <circle cx="100" cy="100" r="28" stroke={color} strokeWidth="0.8" opacity="0.4" />
    <circle cx="100" cy="100" r="22" stroke={color} strokeWidth="0.5" opacity="0.3" />
    {/* Center spindle hole */}
    <circle cx="100" cy="100" r="8" stroke={color} strokeWidth="2" opacity="0.8" />
    <circle cx="100" cy="100" r="3" fill={color} opacity="0.6" />
    {/* Light reflection arc on the vinyl */}
    <path d="M55 55 C60 52, 65 50, 72 48" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3" fill="none" />
    <path d="M130 148 C135 150, 140 150, 148 148" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.25" fill="none" />
    {/* Tonearm hint (subtle diagonal line) */}
    <path d="M170 15 L130 60" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    <circle cx="170" cy="15" r="3" stroke={color} strokeWidth="1" opacity="0.2" fill="none" />
    <circle cx="130" cy="60" r="2" fill={color} opacity="0.15" />
  </svg>
);

const MusicNoteLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 80 100" fill="none" className={className}>
    {/* Main note - stem */}
    <path d="M30 85 L30 20" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Flag / beam flowing from stem top */}
    <path d="M30 20 C30 20, 55 18, 55 32 C55 42, 38 40, 30 38" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M30 30 C30 30, 50 28, 50 40 C50 48, 38 47, 30 46" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
    {/* Note head - filled oval */}
    <ellipse cx="23" cy="87" rx="10" ry="7" transform="rotate(-20 23 87)" fill={color} opacity="0.8" />
    <ellipse cx="23" cy="87" rx="10" ry="7" transform="rotate(-20 23 87)" stroke={color} strokeWidth="1.5" fill="none" />
    {/* Inner highlight on note head */}
    <ellipse cx="21" cy="85" rx="4" ry="2.5" transform="rotate(-20 21 85)" fill={color} opacity="0.15" />
    {/* Small decorative dots around */}
    <circle cx="60" cy="15" r="2" fill={color} opacity="0.4" />
    <circle cx="10" cy="25" r="1.5" fill={color} opacity="0.3" />
    <circle cx="65" cy="50" r="1.5" fill={color} opacity="0.25" />
  </svg>
);

const DoubleNoteLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    {/* Left note stem */}
    <path d="M25 80 L25 25" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Right note stem */}
    <path d="M65 85 L65 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Beam connecting the two notes */}
    <path d="M25 25 L65 30" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <path d="M25 33 L65 38" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    {/* Left note head */}
    <ellipse cx="18" cy="82" rx="10" ry="7" transform="rotate(-15 18 82)" fill={color} opacity="0.8" />
    <ellipse cx="18" cy="82" rx="10" ry="7" transform="rotate(-15 18 82)" stroke={color} strokeWidth="1.5" fill="none" />
    {/* Right note head */}
    <ellipse cx="72" cy="87" rx="10" ry="7" transform="rotate(-15 72 87)" fill={color} opacity="0.8" />
    <ellipse cx="72" cy="87" rx="10" ry="7" transform="rotate(-15 72 87)" stroke={color} strokeWidth="1.5" fill="none" />
    {/* Decorative dots */}
    <circle cx="45" cy="15" r="2" fill={color} opacity="0.3" />
    <circle cx="85" cy="45" r="1.5" fill={color} opacity="0.25" />
  </svg>
);

const SquiggleLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 40 10" fill="none" className={className}>
    <path d="M2 5 Q 6 1, 10 5 T 18 5 T 26 5 T 34 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const MinimalWaveformSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 32 24" fill="none" className={className}>
    <rect x="2" y="10" width="3" height="4" rx="1.5" fill={color} />
    <rect x="7" y="6" width="3" height="12" rx="1.5" fill={color} />
    <rect x="12" y="2" width="3" height="20" rx="1.5" fill={color} />
    <rect x="17" y="5" width="3" height="14" rx="1.5" fill={color} />
    <rect x="22" y="8" width="3" height="8" rx="1.5" fill={color} />
    <rect x="27" y="10" width="3" height="4" rx="1.5" fill={color} />
  </svg>
);

/* ─── Fallback Sample Data ─── */
const fallbackRecentTracks = [
  { _id: 'sample-1', title: "Die For You", artist: { firstName: "The", lastName: "Weeknd" }, coverImage: "https://picsum.photos/seed/weeknd1/300/300", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { _id: 'sample-2', title: "Heat Waves", artist: { firstName: "Glass", lastName: "Animals" }, coverImage: "https://picsum.photos/seed/glass1/300/300", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { _id: 'sample-3', title: "Night Changes", artist: { firstName: "One", lastName: "Direction" }, coverImage: "https://picsum.photos/seed/1d/300/300", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { _id: 'sample-4', title: "Sweater Weather", artist: { firstName: "The", lastName: "Neighbourhood" }, coverImage: "https://picsum.photos/seed/nbhd/300/300", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { _id: 'sample-5', title: "Faded", artist: { firstName: "Alan", lastName: "Walker" }, coverImage: "https://picsum.photos/seed/alan1/300/300", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { _id: 'sample-6', title: "Starboy", artist: { firstName: "The", lastName: "Weeknd" }, coverImage: "https://picsum.photos/seed/star1/300/300", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
];

const fallbackMixes = [
  { _id: 'mix-1', name: "Chill\nMix", coverImage: "https://picsum.photos/seed/chill1/300/225" },
  { _id: 'mix-2', name: "Focus\nMix", coverImage: "https://picsum.photos/seed/focus1/300/225" },
  { _id: 'mix-3', name: "Workout\nMix", coverImage: "https://picsum.photos/seed/work1/300/225" },
  { _id: 'mix-4', name: "Late Night\nMix", coverImage: "https://picsum.photos/seed/night1/300/225" },
  { _id: 'mix-5', name: "Anime\nMix", coverImage: "https://picsum.photos/seed/anime1/300/225" },
];

const fallbackAlbums = [
  { _id: 'sample-alb-1', title: "Soulful Melodies", artist: { firstName: "Arijit", lastName: "Singh" }, coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60", songs: [] },
  { _id: 'sample-alb-2', title: "Romantic Echoes", artist: { firstName: "Atif", lastName: "Aslam" }, coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60", songs: [] },
  { _id: 'sample-alb-3', title: "Symphony of the East", artist: { firstName: "A.R.", lastName: "Rahman" }, coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=60", songs: [] },
];

const fallbackArtists = [
  { _id: 'sample-art-1', artistDetails: { firstName: "Shreya", lastName: "Ghoshal", profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=60" }, totalPlays: 1240 },
  { _id: 'sample-art-2', artistDetails: { firstName: "Arijit", lastName: "Singh", profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=60" }, totalPlays: 980 },
  { _id: 'sample-art-3', artistDetails: { firstName: "A.R.", lastName: "Rahman", profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=60" }, totalPlays: 850 },
  { _id: 'sample-art-4', artistDetails: { firstName: "The", lastName: "Weeknd", profilePicture: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=60" }, totalPlays: 720 },
  { _id: 'sample-art-5', artistDetails: { firstName: "Atif", lastName: "Aslam", profilePicture: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=60" }, totalPlays: 610 },
];

/* ═══════════════════════════════════════════════════════
   PAGE CONTENT COMPONENT
   ═══════════════════════════════════════════════════════ */
const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const user = useSelector(selectCurrentUser);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const [playlistModalItem, setPlaylistModalItem] = useState(null);
  const [playlistModalType, setPlaylistModalType] = useState('track');

  const { data: recentData = [] } = useGetRecentlyPlayedQuery();
  const { data: trendingData = [] } = useGetTrendingMusicQuery(10);
  const { data: communityPlaylists = [] } = useGetCommunityPlaylistsQuery(10);
  const { data: trendingAlbums = [] } = useGetTrendingAlbumsQuery(10);
  const { data: trendingArtists = [] } = useGetTrendingArtistsQuery(10);
  const { data: latestReleases = [] } = useGetLatestReleasesQuery(10);
  const { data: featuredData = [] } = useGetFeaturedQuery();
  const [recordPlay] = useRecordPlayMutation();

  // Live song collections with graceful fallbacks
  const trendingTracks = trendingData.length > 0 ? trendingData : fallbackRecentTracks;
  const recentTracks = recentData.length > 0 ? recentData : trendingTracks.slice(0, 6);

  // Combine live data with graceful fallbacks for horizontal rows
  const displayPlaylists = communityPlaylists.length > 0 ? communityPlaylists : fallbackMixes;
  const displayAlbums = trendingAlbums.length > 0 ? trendingAlbums : fallbackAlbums;
  const displayArtists = trendingArtists.length > 0 ? trendingArtists : fallbackArtists;
  const displayReleases = latestReleases.length > 0 ? latestReleases : trendingTracks.slice(0, 8);

  // Featured slides: admin-pinned or hybrid backfill from API, fallback to curated mix
  const featuredSlides = (Array.isArray(featuredData) && featuredData.length > 0)
    ? featuredData
    : [
        ...(displayAlbums[0] ? [{ type: 'album', item: displayAlbums[0] }] : []),
        ...(trendingTracks[0] ? [{ type: 'track', item: trendingTracks[0] }] : []),
        ...(displayPlaylists[0] ? [{ type: 'playlist', item: displayPlaylists[0] }] : []),
        ...(displayAlbums[1] ? [{ type: 'album', item: displayAlbums[1] }] : []),
        ...(trendingTracks[1] ? [{ type: 'track', item: trendingTracks[1] }] : []),
      ];

  const greeting = getGreeting();
  const displayName = user?.firstName || user?.username || 'Shayan';

  const handlePlaySong = (track, context = recentTracks, e) => {
    if (e) e.stopPropagation();
    dispatch(playTrack(track, context));
    if (track._id && !String(track._id).startsWith('sample-')) {
      recordPlay(track._id).catch(() => {});
    }
  };

  const handleHeroPlay = () => {
    if (currentTrack) {
      dispatch(togglePlay());
    } else if (trendingTracks.length > 0) {
      dispatch(playTracks(trendingTracks, 0));
      const first = trendingTracks[0];
      if (first?._id && !String(first._id).startsWith('sample-')) {
        recordPlay(first._id).catch(() => {});
      }
    }
  };

  const handlePlaySlide = (slide) => {
    if (!slide?.item) return;
    if (slide.type === 'album') {
      handlePlayAlbum(slide.item, null, true);
    } else if (slide.type === 'playlist') {
      handlePlayPlaylist(slide.item, null, true);
    } else {
      // Standalone track -> Append & Jump without clearing queue
      dispatch(playSingleTrack(slide.item));
      if (slide.item._id && !String(slide.item._id).startsWith('sample-')) {
        recordPlay(slide.item._id).catch(() => {});
      }
    }
  };

  const handleOpenSlide = (slide) => {
    if (!slide?.item) return;
    if (slide.type === 'album') {
      if (slide.item._id && !String(slide.item._id).startsWith('sample-')) {
        navigate(`/album/${slide.item._id}`);
      } else {
        handlePlaySlide(slide);
      }
    } else if (slide.type === 'playlist') {
      if (slide.item._id && !String(slide.item._id).startsWith('mix-')) {
        navigate(`/playlist/${slide.item._id}`);
      } else {
        handlePlaySlide(slide);
      }
    } else {
      handlePlaySlide(slide);
    }
  };

  const handlePlayPlaylist = (playlist, e, isPlayButton = false) => {
    if (e) e.stopPropagation();
    if (!isPlayButton && playlist?._id && !String(playlist._id).startsWith('mix-')) {
      navigate(`/playlist/${playlist._id}`);
      return;
    }
    if (playlist?.songs?.length > 0) {
      dispatch(playTracks(playlist.songs, 0));
      const first = playlist.songs[0];
      if (first?._id && !String(first._id).startsWith('sample-')) {
        recordPlay(first._id).catch(() => {});
      }
    } else {
      handleHeroPlay();
    }
  };

  const handlePlayAlbum = (album, e, isPlayButton = false) => {
    if (e) e.stopPropagation();
    if (!isPlayButton && album?._id && !String(album._id).startsWith('sample-')) {
      navigate(`/album/${album._id}`);
      return;
    }
    if (album?.songs?.length > 0) {
      dispatch(playTracks(album.songs, 0));
      const first = album.songs[0];
      if (first?._id && !String(first._id).startsWith('sample-')) {
        recordPlay(first._id).catch(() => {});
      }
    } else {
      handleHeroPlay();
    }
  };

  const handleArtistClick = (artistItem, e) => {
    if (e) e.stopPropagation();
    const artistId = artistItem.artistDetails?._id || artistItem._id;
    if (artistId && !String(artistId).startsWith('sample-')) {
      navigate(`/artist/${artistId}`);
    }
  };

  const handlePlayRelease = (release, e, isPlayButton = false) => {
    if (e) e.stopPropagation();
    const isAlbum = release.releaseType === 'album' || release.type === 'album' || release.songs?.length > 0;
    if (isAlbum) {
      handlePlayAlbum(release, e, isPlayButton);
    } else {
      handlePlaySong(release, displayReleases, e);
    }
  };

  return (
    <>
      {/* ── Hero Section ── */}
      <section
        className="mb-14 flex flex-col md:flex-row gap-10 items-center md:items-stretch relative border rounded-3xl overflow-hidden p-10 md:p-14 bg-sidebar/50 backdrop-blur-sm shadow-sm md:min-h-[440px]"
        style={{ borderColor: accentColor + '40' }}
      >
        {/* Custom SVG Line Art Backgrounds */}
        <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20">
          {/* Large headphones — left side, vertically centered, slightly rotated */}
          <HeadphonesLineSVG
            className="absolute -left-6 top-1/2 -translate-y-[55%] w-56 h-56 md:w-72 md:h-72 rotate-[-12deg]"
            color={accentColor}
          />
          {/* Vinyl disc — bottom center, partially clipped */}
          <VinylDiscLineSVG
            className="absolute left-1/2 -translate-x-1/3 -bottom-20 w-72 h-72 md:w-96 md:h-96"
            color={accentColor}
          />
          {/* Single music note — upper center area */}
          <MusicNoteLineSVG
            className="absolute left-[45%] top-4 w-12 h-14 rotate-[12deg]"
            color={accentColor}
          />
          {/* Double beamed notes — upper right, small */}
          <DoubleNoteLineSVG
            className="absolute right-[38%] top-6 w-10 h-10 rotate-[-8deg] opacity-80"
            color={accentColor}
          />
          {/* Equalizer bars — near the name, right of center */}
          <MinimalWaveformSVG
            className="absolute left-[42%] top-[45%] w-10 h-8"
            color={accentColor}
          />
          {/* Scattered music note — bottom right area */}
          <MusicNoteLineSVG
            className="absolute right-[35%] bottom-12 w-8 h-10 rotate-[-18deg] opacity-60"
            color={accentColor}
          />
        </div>

        {/* Left: Greeting */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <SquiggleLineSVG color={accentColor} className="w-6 h-auto opacity-60" />
            <p className="text-txt-sec text-sm font-space font-bold uppercase tracking-widest">
              {greeting},
            </p>
          </div>

          <h1 className="text-7xl md:text-[80px] font-playfair font-black tracking-normal text-txt leading-none mb-4 -ml-1">
            {displayName}
          </h1>

          <p className="text-txt-muted text-lg font-medium mb-10 flex items-center gap-3">
            Let the music speak.
            <SquiggleLineSVG color={accentColor} className="w-12 h-auto opacity-80" />
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={handleHeroPlay}
              className="flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold w-fit hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
              style={{ backgroundColor: accentColor, color: accentTextColor }}
            >
              {isPlaying ? (
                <>
                  <Pause size={20} fill={accentTextColor} /> Pause
                </>
              ) : currentTrack ? (
                <>
                  <Play size={20} fill={accentTextColor} /> Resume
                </>
              ) : (
                <>
                  <Play size={20} fill={accentTextColor} /> Play Now
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-3 px-8 py-4 rounded-full border border-brd bg-sidebar text-base font-bold text-txt w-fit hover:bg-elevated hover:border-transparent active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Explore
            </button>
          </div>
        </div>

        {/* Right: Featured Showcase Slideshow */}
        <FeaturedShowcase
          slides={featuredSlides}
          accentColor={accentColor}
          onPlay={handlePlaySlide}
          onOpen={handleOpenSlide}
          onArtistClick={(artistId) => navigate(`/artist/${artistId}`)}
          onOpenPlaylistModal={(item, type) => {
            setPlaylistModalItem(item);
            setPlaylistModalType(type);
          }}
        />
      </section>

      {/* ── Recently Played ── */}
      <HorizontalSlider
        title="Recently Played"
        accentColor={accentColor}
      >
        {recentTracks.map((item, i) => {
          const trackTitle = item.title || 'Untitled Track';
          const trackArtist = getDisplayName(item.artist, item.artistName || 'Artist');
          const trackCover = item.coverImage || (item.img ? `https://picsum.photos/seed/${item.img}/300/300` : `https://picsum.photos/seed/${i}/300/300`);
          const isThisPlaying = currentTrack?._id === item._id && isPlaying;

          return (
            <div
              key={item._id || i}
              onClick={(e) => handlePlaySong(item, e)}
              className="shrink-0 w-[180px] group cursor-pointer transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-shadow duration-300 border border-transparent group-hover:border-brd">
                <img
                  src={trackCover}
                  alt={trackTitle}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                {isThisPlaying && (
                  <PlayingOverlay size={28} rounded="rounded-[24px]" color={accentColor} />
                )}

                {/* 3-dot Action Menu (appears on hover) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <TrackActionMenu
                    item={item}
                    itemType="track"
                    onOpenPlaylistModal={(trackItem) => {
                      setPlaylistModalItem(trackItem);
                      setPlaylistModalType('track');
                    }}
                    triggerClassName="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md"
                  />
                </div>

                <button
                  onClick={(e) => handlePlaySong(item, e)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out shadow-lg cursor-pointer"
                  style={{ backgroundColor: accentColor, color: accentTextColor }}
                  aria-label={`Play ${trackTitle}`}
                >
                  <Play size={20} fill={accentTextColor} className="ml-1" />
                </button>
              </div>
              <h3 className="text-base font-bold text-txt truncate mb-0.5 group-hover:text-primary transition-colors">
                {trackTitle}
              </h3>
              <p className="text-sm font-medium text-txt-muted truncate">{trackArtist}</p>
            </div>
          );
        })}
      </HorizontalSlider>

      {/* ── Made For You ── */}
      <HorizontalSlider
        title="Made For You"
        accentColor={accentColor}
        viewAllLink="/discover/top-charts?tab=playlists"
      >
        {displayPlaylists.map((item, i) => {
          const playlistTitle = item.name || item.title || 'Curated Mix';
          const playlistCover = item.coverImage || (item.img ? `https://picsum.photos/seed/${item.img}/300/225` : `https://picsum.photos/seed/mix${i}/300/225`);

          return (
            <div
              key={item._id || i}
              onClick={(e) => handlePlayPlaylist(item, e, false)}
              className="shrink-0 w-[180px] group cursor-pointer transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm group-hover:shadow-xl transition-shadow duration-300 border border-transparent group-hover:border-brd">
                <img
                  src={playlistCover}
                  alt={playlistTitle}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-xl font-space font-black text-white leading-tight whitespace-pre-line drop-shadow-md">
                  {playlistTitle}
                </h3>

                {/* 3-dot Action Menu (appears on hover) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <TrackActionMenu
                    item={item}
                    itemType="playlist"
                    triggerClassName="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md"
                  />
                </div>

                <button
                  onClick={(e) => handlePlayPlaylist(item, e, true)}
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out shadow-lg cursor-pointer"
                  style={{ backgroundColor: accentColor, color: accentTextColor }}
                  aria-label={`Play ${playlistTitle}`}
                >
                  <Play size={16} fill={accentTextColor} className="ml-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </HorizontalSlider>

      {/* ── Popular Albums ── */}
      <HorizontalSlider
        title="Popular Albums"
        icon={<Disc size={20} style={{ color: accentColor }} className="opacity-70" />}
        accentColor={accentColor}
        viewAllLink="/discover/trending"
      >
        {displayAlbums.map((album, i) => {
          const albumTitle = album.title || 'Untitled Album';
          const albumArtist = getDisplayName(album.artist, 'Artist');
          const albumCover =
            album.coverImage || `https://picsum.photos/seed/album${i}/300/300`;
          const trackCount = album.songs?.length || 0;

          return (
            <div
              key={album._id || i}
              onClick={(e) => handlePlayAlbum(album, e, false)}
              className="shrink-0 w-[190px] group cursor-pointer transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-shadow duration-300 border border-transparent group-hover:border-brd bg-sidebar">
                <img
                  src={albumCover}
                  alt={albumTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/seed/album${i}/300/300`;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                {/* 3-dot Action Menu (appears on hover) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <TrackActionMenu
                    item={album}
                    itemType="album"
                    onOpenPlaylistModal={(albumItem) => {
                      setPlaylistModalItem(albumItem);
                      setPlaylistModalType('album');
                    }}
                    triggerClassName="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md"
                  />
                </div>

                <button
                  onClick={(e) => handlePlayAlbum(album, e, true)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out shadow-lg cursor-pointer"
                  style={{ backgroundColor: accentColor, color: accentTextColor }}
                  aria-label={`Play album ${albumTitle}`}
                >
                  <Play size={20} fill={accentTextColor} className="ml-1" />
                </button>
              </div>
              <h3 className="text-base font-bold text-txt truncate mb-0.5 group-hover:text-primary transition-colors">
                {albumTitle}
              </h3>
              <p className="text-sm font-medium text-txt-muted truncate">
                {albumArtist} {trackCount > 0 && `• ${trackCount} tracks`}
              </p>
            </div>
          );
        })}
      </HorizontalSlider>

      {/* ── Top Artists ── */}
      <HorizontalSlider
        title="Top Artists"
        icon={<Sparkles size={20} style={{ color: accentColor }} className="opacity-70" />}
        accentColor={accentColor}
        viewAllLink="/discover/top-charts?tab=artists"
      >
        {displayArtists.map((artistItem, i) => {
          const details = artistItem.artistDetails || {};
          const artistName = getDisplayName(details, details.username || 'Artist');
          const artistAvatar =
            details.profilePicture ||
            `https://picsum.photos/seed/artist${i}/300/300`;
          const playCount = artistItem.totalPlays;

          return (
            <div
              key={artistItem._id || i}
              onClick={(e) => handleArtistClick(artistItem, e)}
              className="shrink-0 w-[170px] group cursor-pointer transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center"
            >
              <div className="relative w-[150px] h-[150px] rounded-full overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-300 border-2 border-transparent group-hover:border-brd bg-sidebar">
                <img
                  src={artistAvatar}
                  alt={artistName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/seed/artist${i}/300/300`;
                  }}
                />
              </div>
              <h3 className="text-base font-bold text-txt truncate w-full group-hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                <span className="truncate">{artistName}</span>
                <CheckCircle2
                  size={14}
                  className="shrink-0"
                  style={{ color: accentColor }}
                />
              </h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-txt-muted mt-0.5">
                {playCount !== undefined ? `${playCount.toLocaleString()} plays` : 'Artist'}
              </p>
            </div>
          );
        })}
      </HorizontalSlider>

      {/* ── New Releases ── */}
      <HorizontalSlider
        title="New Releases"
        badge={
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-space font-bold uppercase tracking-wider border"
            style={{
              borderColor: accentColor + '60',
              color: accentColor,
              backgroundColor: accentColor + '15',
            }}
          >
            Latest
          </span>
        }
        accentColor={accentColor}
        viewAllLink="/discover/new-releases"
      >
        {displayReleases.map((item, i) => {
          const releaseTitle = item.title || 'Untitled';
          const releaseArtist = getDisplayName(item.artist, item.artistName || 'Artist');
          const releaseCover =
            item.coverImage || `https://picsum.photos/seed/rel${i}/300/300`;
          const isAlbum = item.releaseType === 'album';
          const isThisPlaying = (currentTrack?._id === item._id || (isAlbum && currentTrack?.album === item._id)) && isPlaying;

          return (
            <div
              key={item._id || i}
              onClick={(e) => handlePlayRelease(item, e, false)}
              className="shrink-0 w-[180px] group cursor-pointer transition-all duration-300 hover:-translate-y-2"
            >
              <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-shadow duration-300 border border-transparent group-hover:border-brd bg-sidebar">
                <img
                  src={releaseCover}
                  alt={releaseTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/seed/rel${i}/300/300`;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
                {isThisPlaying && (
                  <PlayingOverlay size={28} rounded="rounded-[24px]" color={accentColor} />
                )}

                {/* Badge: Single or Album */}
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-space font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm">
                  {isAlbum ? 'Album' : 'Single'}
                </span>

                {/* 3-dot Action Menu (appears on hover) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <TrackActionMenu
                    item={item}
                    itemType={isAlbum ? 'album' : 'track'}
                    onOpenPlaylistModal={(relItem) => {
                      setPlaylistModalItem(relItem);
                      setPlaylistModalType(isAlbum ? 'album' : 'track');
                    }}
                    triggerClassName="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md"
                  />
                </div>

                <button
                  onClick={(e) => handlePlayRelease(item, e, true)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out shadow-lg cursor-pointer"
                  style={{ backgroundColor: accentColor, color: accentTextColor }}
                  aria-label={`Play ${releaseTitle}`}
                >
                  <Play size={20} fill={accentTextColor} className="ml-1" />
                </button>
              </div>
              <h3 className="text-base font-bold text-txt truncate mb-0.5 group-hover:text-primary transition-colors">
                {releaseTitle}
              </h3>
              <p className="text-sm font-medium text-txt-muted truncate">{releaseArtist}</p>
            </div>
          );
        })}
      </HorizontalSlider>

      {/* ── Add to Playlist Modal ── */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalItem)}
        onClose={() => setPlaylistModalItem(null)}
        item={playlistModalItem}
        itemType={playlistModalType}
      />
    </>
  );
};

export default HomePage;

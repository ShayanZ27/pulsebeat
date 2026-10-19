import React, { useState } from 'react';
import { useParams, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  TrendingUp,
  Star,
  BarChart3,
  Headphones,
  Play,
  Flame,
  Sparkles,
  Music2,
  Disc,
  ArrowLeft,
  Shuffle,
} from 'lucide-react';
import {
  useGetTrendingMusicQuery,
  useGetTrendingAlbumsQuery,
  useGetLatestReleasesQuery,
  useGetAllMusicQuery,
  useRecordPlayMutation,
} from '../store/api';
import { playTracks, selectCurrentTrack, selectIsPlaying } from '../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../store/themeSlice';
import TrackActionMenu from '../components/common/TrackActionMenu';
import AddToPlaylistModal from '../components/common/AddToPlaylistModal';
import { PlayingOverlay, PlayingHeartbeat } from '../components/common/PulseAnimations';
import { formatTime } from '../utils/format';
import CategoryIcon from '../components/common/CategoryIcon';

const GENRE_CARDS = [
  {
    name: 'Bollywood',
    color: 'from-amber-500 via-orange-600 to-red-600',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    desc: 'Desi beats, film hits & soulful melodies',
  },
  {
    name: 'Pop',
    color: 'from-pink-500 via-rose-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    desc: 'Chart-toppers, infectious hooks & global sounds',
  },
  {
    name: 'Rock',
    color: 'from-red-600 via-stone-800 to-stone-950',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80',
    desc: 'Electric riffs, anthems & raw power',
  },
  {
    name: 'Hip-Hop',
    color: 'from-violet-600 via-purple-700 to-indigo-900',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    desc: 'Heavy 808s, rhythmic flow & street vibes',
  },
  {
    name: 'Rap',
    color: 'from-fuchsia-600 via-purple-800 to-slate-900',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
    desc: 'Fast bars, sharp delivery & punchy rhythms',
  },
  {
    name: 'EDM',
    color: 'from-cyan-500 via-blue-600 to-indigo-700',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop&q=80',
    desc: 'Festival drops, synths & dance euphoria',
  },
  {
    name: 'Indie',
    color: 'from-emerald-500 via-teal-600 to-cyan-800',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=80',
    desc: 'Acoustic vibes, dreamy melodies & indie souls',
  },
  {
    name: 'Classical',
    color: 'from-slate-600 via-slate-800 to-stone-900',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&auto=format&fit=crop&q=80',
    desc: 'Timeless symphonies, sitars & orchestral mastery',
  },
  {
    name: 'Instrumental',
    color: 'from-indigo-500 via-purple-600 to-pink-600',
    image: 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=800&auto=format&fit=crop&q=80',
    desc: 'Expressive keys, ambient tones & pure music',
  },
  {
    name: 'Jazz',
    color: 'from-amber-600 via-yellow-700 to-stone-800',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    desc: 'Smooth brass, nocturnal groove & swing',
  },
];

const MOOD_CARDS = [
  {
    name: 'Happy',
    color: 'from-amber-400 via-yellow-500 to-orange-500',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    desc: 'Upbeat tempos & sunny feel-good vibes',
  },
  {
    name: 'Romantic',
    color: 'from-rose-500 via-red-500 to-pink-600',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80',
    desc: 'Heartfelt lyrics, duets & intimate love',
  },
  {
    name: 'Chill',
    color: 'from-teal-400 via-cyan-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    desc: 'Mellow frequencies & lo-fi relaxation',
  },
  {
    name: 'Party',
    color: 'from-fuchsia-500 via-pink-600 to-purple-700',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    desc: 'Weekend bangers & dancefloor heat',
  },
  {
    name: 'Energetic',
    color: 'from-orange-500 via-red-600 to-amber-700',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    desc: 'High-octane fuel & workout motivation',
  },
  {
    name: 'Sad',
    color: 'from-blue-600 via-indigo-700 to-slate-900',
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
    desc: 'Poignant ballads & heartbreak echoes',
  },
  {
    name: 'Calm',
    color: 'from-emerald-400 via-teal-500 to-cyan-700',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    desc: 'Peaceful acoustics & quiet tranquility',
  },
  {
    name: 'Focus',
    color: 'from-cyan-600 via-blue-700 to-indigo-900',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
    desc: 'Deep concentration & flow state',
  },
  {
    name: 'Nostalgic',
    color: 'from-amber-600 via-orange-700 to-stone-800',
    image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop&q=80',
    desc: 'Golden memories & retro warmth',
  },
  {
    name: 'Sleep',
    color: 'from-indigo-800 via-slate-900 to-black',
    image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    desc: 'Lullabies, ambient drift & deep rest',
  },
];

export default function DiscoverPage() {
  const { section = 'trending' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get('type'); // 'genre' | 'mood'
  const selectedName = searchParams.get('name'); // e.g. 'Bollywood'
  const [catalogFilter, setCatalogFilter] = useState('all'); // 'all' | 'genres' | 'moods'

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const [playlistModalItem, setPlaylistModalItem] = useState(null);
  const [playlistModalType, setPlaylistModalType] = useState('track');

  const { data: trendingTracks = [], isLoading: loadingTrending } = useGetTrendingMusicQuery(30);
  const { data: trendingAlbums = [], isLoading: loadingAlbums } = useGetTrendingAlbumsQuery(20);
  const { data: latestReleases = [], isLoading: loadingReleases } = useGetLatestReleasesQuery(30);

  const {
    data: categorySongs = [],
    isLoading: loadingCategorySongs,
    isFetching: fetchingCategorySongs,
  } = useGetAllMusicQuery(
    selectedType && selectedName ? { [selectedType]: selectedName } : undefined,
    { skip: !selectedType || !selectedName || section !== 'genres' }
  );

  const [recordPlay] = useRecordPlayMutation();

  const handlePlaySong = (song, trackList = [song], index = 0) => {
    dispatch(playTracks(trackList, index));
    if (song?._id && !String(song._id).startsWith('sample-')) {
      recordPlay(song._id).catch(() => {});
    }
  };

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp, path: '/discover/trending' },
    { id: 'new-releases', label: 'New Releases', icon: Star, path: '/discover/new-releases' },
    { id: 'top-charts', label: 'Top Charts', icon: BarChart3, path: '/discover/top-charts' },
    { id: 'genres', label: 'Genres & Moods', icon: Headphones, path: '/discover/genres' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-10 border border-brd bg-gradient-to-br from-sidebar via-elevated to-sidebar shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ backgroundColor: accentColor }} />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-space font-bold tracking-wider uppercase mb-4 bg-sidebar border border-brd text-primary" style={{ color: accentColor }}>
            <Sparkles size={14} /> Discover Hub
          </div>
          <h1 className="text-3xl md:text-5xl font-playfair font-black text-txt tracking-tight leading-tight">
            Explore Sounds Across PulseBeat
          </h1>
          <p className="mt-3 text-txt-sec text-sm md:text-base font-normal">
            Dive into trending anthems, freshly dropped records, chart rankings, and curated moods.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = section === tab.id;
              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs md:text-sm font-space font-bold transition-all shadow-sm ${
                    isActive
                      ? 'shadow-md scale-105'
                      : 'bg-sidebar border border-brd text-txt-sec hover:text-txt hover:bg-elevated'
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: accentColor, color: accentTextColor, borderColor: accentColor }
                      : undefined
                  }
                >
                  <Icon size={16} />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── SECTION CONTENT ─── */}

      {/* 1. TRENDING */}
      {section === 'trending' && (
        <div className="space-y-8">
          {/* Trending Tracks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={20} style={{ color: accentColor }} />
                <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">Trending Songs</h2>
              </div>
              <span className="text-xs text-txt-muted font-space">Top tracks moving up the pulse</span>
            </div>

            {loadingTrending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-sidebar border border-brd animate-pulse" />
                ))}
              </div>
            ) : trendingTracks.length === 0 ? (
              <div className="text-center py-12 bg-sidebar rounded-2xl border border-brd text-txt-muted text-sm">
                No trending tracks available right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {trendingTracks.map((song, idx) => {
                  const isThisPlaying = currentTrack?._id === song._id && isPlaying;
                  return (
                    <div
                      key={song._id || idx}
                      onClick={() => handlePlaySong(song, trendingTracks, idx)}
                      className="group flex items-center justify-between p-3 rounded-2xl bg-sidebar hover:bg-elevated border border-brd transition-all hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm bg-elevated">
                          <img
                            src={song.coverImage || 'https://picsum.photos/seed/track/100/100'}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {isThisPlaying ? (
                            <PlayingOverlay size={20} rounded="rounded-xl" color={accentColor} />
                          ) : (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play size={18} className="text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-bold truncate group-hover:text-primary transition-colors"
                            style={isThisPlaying ? { color: accentColor } : undefined}
                          >
                            {song.title}
                          </p>
                          <p className="text-xs text-txt-sec truncate">
                            {song.artist?.firstName
                              ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                              : song.artist?.username || 'Unknown Artist'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-txt-muted font-space hidden sm:inline">
                          {formatTime(song.duration)}
                        </span>
                        <TrackActionMenu
                          item={song}
                          itemType="track"
                          onOpenPlaylistModal={(trackItem) => {
                            setPlaylistModalItem(trackItem);
                            setPlaylistModalType('track');
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Trending Albums */}
          {trendingAlbums.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Disc size={20} style={{ color: accentColor }} />
                  <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">Popular Albums</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {trendingAlbums.map((album) => {
                  const albumTitle = album.title || 'Untitled Album';
                  const albumArtist = album.artist?.firstName
                    ? `${album.artist.firstName} ${album.artist.lastName || ''}`.trim()
                    : album.artist?.username || 'PulseBeat Artist';
                  const albumCover = album.coverImage || 'https://picsum.photos/seed/album/300/300';

                  return (
                    <div
                      key={album._id}
                      onClick={() => navigate(`/album/${album._id}`)}
                      className="group p-3.5 rounded-2xl bg-sidebar hover:bg-elevated border border-brd transition-all hover:shadow-lg cursor-pointer flex flex-col relative"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-sm">
                        <img
                          src={albumCover}
                          alt={albumTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* 3-dot Action Menu */}
                        <div
                          className="absolute top-2 right-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TrackActionMenu
                            item={album}
                            itemType="album"
                            onOpenPlaylistModal={(modalItem) => {
                              setPlaylistModalItem(modalItem);
                              setPlaylistModalType('album');
                            }}
                            triggerClassName="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md"
                            buttonSize={30}
                            iconSize={15}
                          />
                        </div>

                        {/* Hover Play Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (album.songs?.length) {
                              dispatch(playTracks(album.songs, 0));
                            } else {
                              navigate(`/album/${album._id}`);
                            }
                          }}
                          className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl cursor-pointer z-10 hover:scale-110 active:scale-95"
                          style={{ backgroundColor: accentColor, color: accentTextColor }}
                          aria-label={`Play ${albumTitle}`}
                        >
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-txt truncate group-hover:text-primary transition-colors">
                        {albumTitle}
                      </p>
                      <p className="text-xs text-txt-sec truncate mt-0.5">
                        {albumArtist}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 2. NEW RELEASES */}
      {section === 'new-releases' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={20} style={{ color: accentColor }} />
            <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">Fresh Releases</h2>
          </div>

          {loadingReleases ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-sidebar border border-brd animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {latestReleases.map((item) => {
                const isAlbum = item.type === 'album' || item.releaseType === 'album' || Boolean(item.songs?.length);
                const trackTitle = item.title || item.name || 'Untitled';
                const trackArtist = item.artist?.firstName
                  ? `${item.artist.firstName} ${item.artist.lastName || ''}`.trim()
                  : item.artist?.username || 'PulseBeat Artist';
                const trackCover = item.coverImage || (isAlbum ? 'https://picsum.photos/seed/album/300/300' : 'https://picsum.photos/seed/track/300/300');

                const singlesList = latestReleases.filter(
                  (r) => !r.songs && r.type !== 'album' && r.releaseType !== 'album'
                );
                const songIndex = singlesList.findIndex(
                  (s) => String(s._id || s.id) === String(item._id || item.id)
                );

                const handleCardClick = () => {
                  if (isAlbum) {
                    navigate(`/album/${item._id}`);
                  } else {
                    handlePlaySong(item, singlesList, songIndex >= 0 ? songIndex : 0);
                  }
                };

                const handlePlayClick = (e) => {
                  e.stopPropagation();
                  if (isAlbum) {
                    if (item.songs?.length) {
                      dispatch(playTracks(item.songs, 0));
                    } else {
                      navigate(`/album/${item._id}`);
                    }
                  } else {
                    handlePlaySong(item, singlesList, songIndex >= 0 ? songIndex : 0);
                  }
                };

                const isThisPlaying = (currentTrack?._id === item._id || (isAlbum && currentTrack?.album === item._id)) && isPlaying;

                return (
                  <div
                    key={item._id}
                    onClick={handleCardClick}
                    className="group p-3.5 rounded-2xl bg-sidebar hover:bg-elevated border border-brd transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col relative"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-sm bg-elevated">
                      <img
                        src={trackCover}
                        alt={trackTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isThisPlaying && (
                        <PlayingOverlay size={28} rounded="rounded-xl" color={accentColor} />
                      )}
                      {/* Badge: Album or Single */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-space font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md z-10">
                        {isAlbum ? 'Album' : 'Single'}
                      </span>

                      {/* 3-dot Action Menu */}
                      <div
                        className="absolute top-2 right-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TrackActionMenu
                          item={item}
                          itemType={isAlbum ? 'album' : 'track'}
                          onOpenPlaylistModal={(modalItem) => {
                            setPlaylistModalItem(modalItem);
                            setPlaylistModalType(isAlbum ? 'album' : 'track');
                          }}
                          triggerClassName="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-md"
                          buttonSize={30}
                          iconSize={15}
                        />
                      </div>

                      {/* Hover Play Button */}
                      <button
                        type="button"
                        onClick={handlePlayClick}
                        className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl cursor-pointer z-10 hover:scale-110 active:scale-95"
                        style={{ backgroundColor: accentColor, color: accentTextColor }}
                        aria-label={`Play ${trackTitle}`}
                      >
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-txt truncate group-hover:text-primary transition-colors">
                      {trackTitle}
                    </p>
                    <p className="text-xs text-txt-sec truncate mt-0.5">
                      {trackArtist}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. TOP CHARTS */}
      {section === 'top-charts' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} style={{ color: accentColor }} />
            <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">PulseBeat Top Charts</h2>
          </div>

          <div className="bg-sidebar rounded-2xl border border-brd overflow-hidden shadow-sm">
            <div className="p-4 border-b border-brd grid grid-cols-12 text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
              <span className="col-span-1 text-center">#</span>
              <span className="col-span-6 md:col-span-7">Title</span>
              <span className="col-span-3 md:col-span-2 text-right">Plays</span>
              <span className="col-span-2 text-right pr-2">Duration</span>
            </div>

            <div className="divide-y divide-brd/50">
              {trendingTracks.slice(0, 25).map((song, i) => {
                const isThisPlaying = currentTrack?._id === song._id && isPlaying;
                return (
                  <div
                    key={song._id || i}
                    onClick={() => handlePlaySong(song, trendingTracks, i)}
                    className="grid grid-cols-12 items-center p-3.5 hover:bg-elevated transition-colors cursor-pointer group"
                  >
                    <span className={`col-span-1 text-center font-space font-black text-sm ${i < 3 ? 'text-primary' : 'text-txt-muted'}`} style={i < 3 ? { color: accentColor } : undefined}>
                      {i + 1}
                    </span>
                    <div className="col-span-6 md:col-span-7 flex items-center gap-3 min-w-0 pr-2">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm bg-elevated">
                        <img
                          src={song.coverImage || 'https://picsum.photos/seed/track/80/80'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {isThisPlaying && (
                          <PlayingOverlay size={16} rounded="rounded-lg" color={accentColor} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-bold truncate group-hover:text-primary transition-colors"
                          style={isThisPlaying ? { color: accentColor } : undefined}
                        >
                          {song.title}
                        </p>
                        <p className="text-xs text-txt-sec truncate">
                          {song.artist?.firstName
                            ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                            : song.artist?.username || 'Artist'}
                        </p>
                      </div>
                    </div>
                  <span className="col-span-3 md:col-span-2 text-right text-xs font-space text-txt-sec">
                    {(song.plays || 0).toLocaleString()}
                  </span>
                  <div className="col-span-2 flex items-center justify-end gap-2 pr-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-space text-txt-muted">
                      {formatTime(song.duration)}
                    </span>
                    <TrackActionMenu
                      item={song}
                      itemType="track"
                      onOpenPlaylistModal={(trackItem) => {
                        setPlaylistModalItem(trackItem);
                        setPlaylistModalType('track');
                      }}
                    />
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </section>
      )}

      {/* 4. GENRES & MOODS */}
      {section === 'genres' && (
        <section className="space-y-6">
          {selectedType && selectedName ? (
            /* ─── DRILLDOWN CATEGORY VIEW ─── */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back to All button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sidebar hover:bg-elevated border border-brd text-xs font-bold text-txt-sec hover:text-txt transition-all cursor-pointer shadow-sm group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  All Genres &amp; Moods
                </button>

                <div className="flex items-center gap-2 text-xs font-space text-txt-muted">
                  <span className="capitalize font-bold text-primary" style={{ color: accentColor }}>
                    {selectedType}
                  </span>
                  <span>/</span>
                  <span className="font-bold text-txt">{selectedName}</span>
                </div>
              </div>

              {/* Category Hero Banner */}
              {(() => {
                const activeCard =
                  (selectedType === 'mood' ? MOOD_CARDS : GENRE_CARDS).find(
                    (c) => c.name.toLowerCase() === selectedName.toLowerCase()
                  ) || {
                    name: selectedName,
                    color: 'from-purple-600 via-indigo-700 to-slate-900',
                    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
                    desc: `${selectedName} tracks curated across PulseBeat`,
                  };

                return (
                  <div
                    className="relative rounded-3xl overflow-hidden p-6 md:p-10 border border-white/10 text-white shadow-2xl"
                  >
                    {/* Artwork Background */}
                    {activeCard.image && (
                      <img
                        src={activeCard.image}
                        alt={activeCard.name}
                        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                      />
                    )}

                    {/* Color Tint Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${activeCard.color} opacity-65 mix-blend-multiply pointer-events-none`}
                    />

                    {/* Dark Readability Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/40 pointer-events-none" />

                    {/* Ambient glow in corner */}
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none bg-white" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="space-y-3 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-space font-bold uppercase tracking-wider bg-black/50 text-white backdrop-blur-md border border-white/15 shadow-sm">
                          <CategoryIcon name={activeCard.name} size={16} className="text-white" />
                          <span>{selectedType === 'mood' ? 'Curated Mood' : 'Genre Spotlight'}</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-playfair font-black tracking-tight drop-shadow-lg">
                          {activeCard.name}
                        </h2>
                        <p className="text-sm md:text-base text-white/95 font-medium leading-relaxed drop-shadow-sm">
                          {activeCard.desc}
                        </p>
                        <p className="text-xs text-white/80 font-space font-semibold">
                          {loadingCategorySongs
                            ? 'Loading songs...'
                            : `${categorySongs.length} ${
                                categorySongs.length === 1 ? 'song' : 'songs'
                              } available`}
                        </p>
                      </div>

                      {/* Play & Shuffle buttons */}
                      {categorySongs.length > 0 && (
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePlaySong(categorySongs[0], categorySongs, 0)}
                            className="px-6 py-3 rounded-full bg-white text-black font-space font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Play size={18} fill="currentColor" /> Play All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const shuffled = [...categorySongs].sort(() => Math.random() - 0.5);
                              handlePlaySong(shuffled[0], shuffled, 0);
                            }}
                            className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                            title="Shuffle Play"
                            aria-label="Shuffle Play"
                          >
                            <Shuffle size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Songs List */}
              <div className="bg-sidebar rounded-2xl border border-brd overflow-hidden shadow-sm">
                <div className="p-4 border-b border-brd flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music2 size={16} style={{ color: accentColor }} />
                    <h3 className="text-sm font-space font-bold uppercase tracking-wider text-txt">
                      {selectedName} Collection
                    </h3>
                  </div>
                  <span className="text-xs text-txt-muted font-space">
                    {categorySongs.length} {categorySongs.length === 1 ? 'track' : 'tracks'}
                  </span>
                </div>

                {loadingCategorySongs || fetchingCategorySongs ? (
                  <div className="p-4 space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-xl bg-elevated/60 animate-pulse border border-brd/40"
                      />
                    ))}
                  </div>
                ) : categorySongs.length === 0 ? (
                  <div className="py-16 text-center text-txt-muted space-y-3 px-4">
                    <Music2 size={40} className="mx-auto text-txt-muted opacity-40" />
                    <p className="text-base font-bold text-txt">
                      No songs found in {selectedName}
                    </p>
                    <p className="text-xs text-txt-sec max-w-sm mx-auto">
                      There are currently no songs tagged with {selectedName.toLowerCase()} in the library.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchParams({})}
                      className="mt-2 px-4 py-2 rounded-xl bg-elevated hover:bg-elevated/80 border border-brd text-xs font-bold text-txt transition-all cursor-pointer"
                    >
                      Browse Other Genres &amp; Moods
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-brd/50">
                    {categorySongs.map((song, i) => {
                      const isThisPlaying = currentTrack?._id === song._id && isPlaying;
                      return (
                        <div
                          key={song._id || i}
                          onClick={() => handlePlaySong(song, categorySongs, i)}
                          className="flex items-center justify-between p-3.5 hover:bg-elevated transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-3">
                            <span className="w-5 text-center text-xs font-space font-bold text-txt-muted group-hover:text-primary transition-colors">
                              {i + 1}
                            </span>
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm bg-elevated">
                              <img
                                src={song.coverImage || 'https://picsum.photos/seed/track/100/100'}
                                alt={song.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {isThisPlaying ? (
                                <PlayingOverlay size={18} rounded="rounded-xl" color={accentColor} />
                              ) : (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play size={16} className="text-white fill-white ml-0.5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-bold truncate group-hover:text-primary transition-colors"
                                style={isThisPlaying ? { color: accentColor } : undefined}
                              >
                                {song.title}
                              </p>
                            <p className="text-xs text-txt-sec truncate">
                              {song.artist?.firstName
                                ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                                : song.artist?.username || 'PulseBeat Artist'}
                            </p>
                          </div>
                        </div>

                        {/* Pills & Actions */}
                        <div
                          className="flex items-center gap-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {song.genre && (
                            <button
                              type="button"
                              onClick={() => setSearchParams({ type: 'genre', name: song.genre })}
                              className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-space font-bold border transition-colors cursor-pointer ${
                                selectedType === 'genre' &&
                                selectedName.toLowerCase() === song.genre.toLowerCase()
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'bg-elevated border-brd text-txt-sec hover:border-primary hover:text-primary'
                              }`}
                              title={`View all ${song.genre} songs`}
                            >
                              {song.genre}
                            </button>
                          )}
                          {song.mood && (
                            <button
                              type="button"
                              onClick={() => setSearchParams({ type: 'mood', name: song.mood })}
                              className={`hidden md:inline-block px-2.5 py-1 rounded-full text-[10px] font-space font-bold border transition-colors cursor-pointer ${
                                selectedType === 'mood' &&
                                selectedName.toLowerCase() === song.mood.toLowerCase()
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'bg-elevated border-brd text-txt-sec hover:border-primary hover:text-primary'
                              }`}
                              title={`View all ${song.mood} songs`}
                            >
                              {song.mood}
                            </button>
                          )}
                          <span className="text-xs font-space text-txt-muted px-1">
                            {formatTime(song.duration)}
                          </span>
                          <TrackActionMenu
                            item={song}
                            itemType="track"
                            onOpenPlaylistModal={(trackItem) => {
                              setPlaylistModalItem(trackItem);
                              setPlaylistModalType('track');
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

              {/* Jump to Other Categories */}
              <div className="pt-4 border-t border-brd space-y-3">
                <p className="text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
                  Explore More {selectedType === 'mood' ? 'Moods' : 'Genres'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedType === 'mood' ? MOOD_CARDS : GENRE_CARDS)
                    .filter((c) => c.name.toLowerCase() !== selectedName.toLowerCase())
                    .map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSearchParams({ type: selectedType, name: c.name })}
                        className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-space font-bold bg-sidebar hover:bg-elevated border border-brd text-txt-sec hover:text-txt transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                      >
                        <CategoryIcon
                          name={c.name}
                          size={14}
                          className="text-txt-sec group-hover:text-primary transition-colors"
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            /* ─── ALL CARDS OVERVIEW ─── */
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header & Sub-filter pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Headphones size={22} style={{ color: accentColor }} />
                  <div>
                    <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">
                      Browse Genres &amp; Moods
                    </h2>
                    <p className="text-xs text-txt-muted font-space">
                      Select any category to stream its curated catalog
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-sidebar p-1 rounded-2xl border border-brd shrink-0">
                  <button
                    type="button"
                    onClick={() => setCatalogFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
                      catalogFilter === 'all'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-muted hover:text-txt'
                    }`}
                  >
                    All ({GENRE_CARDS.length + MOOD_CARDS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogFilter('genres')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
                      catalogFilter === 'genres'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-muted hover:text-txt'
                    }`}
                  >
                    Genres ({GENRE_CARDS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogFilter('moods')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
                      catalogFilter === 'moods'
                        ? 'bg-elevated text-txt shadow-sm border border-brd'
                        : 'text-txt-muted hover:text-txt'
                    }`}
                  >
                    Moods ({MOOD_CARDS.length})
                  </button>
                </div>
              </div>

              {/* 1. GENRES GRID */}
              {(catalogFilter === 'all' || catalogFilter === 'genres') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon name="rock" size={20} className="text-primary" />
                      <h3 className="text-lg font-playfair font-bold text-txt">
                        Musical Genres
                      </h3>
                    </div>
                    <span className="text-xs font-space text-txt-muted">
                      {GENRE_CARDS.length} genres
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {GENRE_CARDS.map((card) => (
                      <div
                        key={card.name}
                        onClick={() => setSearchParams({ type: 'genre', name: card.name })}
                        className="group relative h-44 rounded-3xl p-5 text-white shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between border border-white/10"
                      >
                        {/* Customized Artwork Background */}
                        <img
                          src={card.image}
                          alt={card.name}
                          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out pointer-events-none"
                          loading="lazy"
                        />

                        {/* Color Tint Overlay for Genre Identity */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-65 mix-blend-multiply pointer-events-none`}
                        />

                        {/* Dark Overlay for Readability and Depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 pointer-events-none" />

                        {/* Ambient hover glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/5 transition-opacity duration-300 pointer-events-none" />

                        {/* Top Row: Custom SVG Icon & Category Tag */}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="w-10 h-10 rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:bg-black/60 group-hover:border-white/30 transition-all duration-300">
                            <CategoryIcon name={card.name} size={22} className="text-white" />
                          </div>
                          <span className="text-[10px] font-space font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white/90 shadow-sm">
                            Genre
                          </span>
                        </div>

                        {/* Bottom Row: Typography */}
                        <div className="relative z-10">
                          <h4 className="font-playfair font-black text-xl md:text-2xl leading-tight tracking-tight text-white drop-shadow-md group-hover:translate-x-1 transition-transform duration-300">
                            {card.name}
                          </h4>
                          <p className="text-xs text-white/90 line-clamp-1 mt-1 leading-snug drop-shadow font-medium">
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. MOODS GRID */}
              {(catalogFilter === 'all' || catalogFilter === 'moods') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon name="happy" size={20} className="text-primary" />
                      <h3 className="text-lg font-playfair font-bold text-txt">
                        Curated Moods
                      </h3>
                    </div>
                    <span className="text-xs font-space text-txt-muted">
                      {MOOD_CARDS.length} moods
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {MOOD_CARDS.map((card) => (
                      <div
                        key={card.name}
                        onClick={() => setSearchParams({ type: 'mood', name: card.name })}
                        className="group relative h-44 rounded-3xl p-5 text-white shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between border border-white/10"
                      >
                        {/* Customized Artwork Background */}
                        <img
                          src={card.image}
                          alt={card.name}
                          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out pointer-events-none"
                          loading="lazy"
                        />

                        {/* Color Tint Overlay for Mood Identity */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-65 mix-blend-multiply pointer-events-none`}
                        />

                        {/* Dark Overlay for Readability and Depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 pointer-events-none" />

                        {/* Ambient hover glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/5 transition-opacity duration-300 pointer-events-none" />

                        {/* Top Row: Custom SVG Icon & Category Tag */}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="w-10 h-10 rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:bg-black/60 group-hover:border-white/30 transition-all duration-300">
                            <CategoryIcon name={card.name} size={22} className="text-white" />
                          </div>
                          <span className="text-[10px] font-space font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white/90 shadow-sm">
                            Mood
                          </span>
                        </div>

                        {/* Bottom Row: Typography */}
                        <div className="relative z-10">
                          <h4 className="font-playfair font-black text-xl md:text-2xl leading-tight tracking-tight text-white drop-shadow-md group-hover:translate-x-1 transition-transform duration-300">
                            {card.name}
                          </h4>
                          <p className="text-xs text-white/90 line-clamp-1 mt-1 leading-snug drop-shadow font-medium">
                            {card.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalItem)}
        onClose={() => setPlaylistModalItem(null)}
        item={playlistModalItem}
        itemType={playlistModalType}
      />
    </div>
  );
}

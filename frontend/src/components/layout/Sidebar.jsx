import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3,
  Headphones,
  Home,
  Library,
  LogOut,
  Plus,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useGetUserPlaylistsQuery, useLogoutMutation, useRecordPlayMutation } from '../../store/api';
import { selectCurrentUser } from '../../store/authSlice';
import { playTracks } from '../../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { LogoPulseSVG, SquiggleLineSVG } from '../icons/LineArt';

const fallbackPlaylists = [
  { name: 'Chill Vibes', color: '#C6F24E' },
  { name: 'Late Night Drive', color: '#8B5CF6' },
  { name: 'Workout Mix', color: '#EF4444' },
  { name: 'Focus Mode', color: '#3B82F6' },
  { name: 'Anime Hits', color: '#EC4899' },
];

const playlistColors = ['#C6F24E', '#8B5CF6', '#EF4444', '#3B82F6', '#EC4899', '#F59E0B', '#10B981'];

export default function Sidebar() {
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const user = useSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();
  const [recordPlay] = useRecordPlayMutation();
  const { data: userPlaylists = [] } = useGetUserPlaylistsQuery();

  const playlistsToDisplay = userPlaylists.length > 0
    ? userPlaylists.map((pl, i) => ({
        _id: pl._id,
        name: pl.name,
        songs: pl.songs || [],
        color: playlistColors[i % playlistColors.length],
      }))
    : fallbackPlaylists;

  const handlePlaylistClick = (pl) => {
    if (pl?.songs?.length > 0) {
      dispatch(playTracks(pl.songs, 0));
      const first = pl.songs[0];
      if (first?._id && !String(first._id).startsWith('sample-')) {
        recordPlay(first._id).catch(() => {});
      }
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 bg-sidebar border-r border-brd overflow-hidden relative z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)] dark:shadow-none">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <LogoPulseSVG color={accentColor} size={28} />
          <span className="text-[22px] font-playfair font-black tracking-tight text-txt">PulseBeat</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="px-4 space-y-2">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm"
          style={{ backgroundColor: accentColor, color: accentTextColor }}
        >
          <Home size={20} /> Home
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-txt-sec hover:text-primary hover:bg-elevated transition-colors group">
          <Search size={20} className="group-hover:text-primary transition-colors" /> Search
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-txt-sec hover:text-primary hover:bg-elevated transition-colors group">
          <Library size={20} className="group-hover:text-primary transition-colors" /> Your Library
        </button>
      </nav>

      {/* Discover */}
      <div className="mt-8 px-6">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[11px] font-space font-bold uppercase tracking-widest" style={{ color: accentColor }}>Discover</p>
          <SquiggleLineSVG color={accentColor} className="w-6 h-auto opacity-70" />
        </div>
        <div className="space-y-4 text-sm font-medium text-txt-sec">
          <p className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors group"><TrendingUp size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Trending</p>
          <p className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors group"><Star size={18} className="group-hover:scale-110 transition-transform" /> New Releases</p>
          <p className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors group"><BarChart3 size={18} className="group-hover:scale-110 transition-transform" /> Top Charts</p>
          <p className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors group"><Headphones size={18} className="group-hover:scale-110 transition-transform" /> Genres &amp; Moods</p>
        </div>
      </div>

      {/* Your Library */}
      <div className="mt-8 px-6 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-space font-bold uppercase tracking-widest" style={{ color: accentColor }}>Playlists</p>
          <button className="text-txt-muted hover:text-primary transition-colors"><Plus size={16} /></button>
        </div>
        <div className="space-y-4 text-sm font-medium text-txt-sec pb-4">
          {playlistsToDisplay.map((pl, i) => (
            <p
              key={pl._id || i}
              onClick={() => handlePlaylistClick(pl)}
              className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors group select-none"
              title={pl.songs?.length ? `${pl.name} (${pl.songs.length} songs)` : pl.name}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform shadow-sm"
                style={{ backgroundColor: pl.color }}
              />
              <span className="truncate">{pl.name}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Profile */}
      <div className="p-5 border-t border-brd flex items-center gap-4 cursor-pointer hover:bg-elevated transition-colors bg-sidebar">
        <img src="https://picsum.photos/seed/userprofile/48/48" className="w-10 h-10 rounded-full object-cover shadow-sm" alt="Profile" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-txt truncate font-space">{user?.username}</p>
          <p className="text-[11px] font-semibold flex items-center gap-1" style={{ color: accentColor }}>
            Premium <span className="text-[10px]">✦</span>
          </p>
        </div>
        <button
          id="logout-button"
          onClick={() => logout()}
          className="w-8 h-8 rounded-full flex items-center justify-center text-txt-muted hover:text-txt hover:bg-bg transition-colors"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

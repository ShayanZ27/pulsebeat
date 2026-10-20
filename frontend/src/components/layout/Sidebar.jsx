import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3,
  Compass,
  Headphones,
  Home,
  Library,
  LogOut,
  Plus,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useGetUserPlaylistsQuery, useLogoutMutation, useRecordPlayMutation } from '../../store/api';
import { selectCurrentUser } from '../../store/authSlice';
import { playTracks } from '../../store/playerSlice';
import { selectAccentColor, selectAccentTextColor } from '../../store/themeSlice';
import { LogoPulseSVG, SquiggleLineSVG } from '../icons/LineArt';
import CreatePlaylistModal from '../common/CreatePlaylistModal';

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
  const navigate = useNavigate();
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const user = useSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();
  const [recordPlay] = useRecordPlayMutation();
  const { data: userPlaylists = [] } = useGetUserPlaylistsQuery();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      <div
        onClick={() => navigate('/')}
        className="flex items-center justify-between px-6 py-8 cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <LogoPulseSVG color={accentColor} size={28} />
          <span className="text-[22px] font-playfair font-black tracking-tight text-txt group-hover:text-primary transition-colors">PulseBeat</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="px-4 space-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              isActive
                ? 'shadow-sm scale-[1.02]'
                : 'text-txt-sec hover:text-primary hover:bg-elevated'
            }`
          }
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: accentColor, color: accentTextColor }
              : undefined
          }
        >
          <Home size={20} /> Home
        </NavLink>

        <NavLink
          to="/discover/genres"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              isActive
                ? 'shadow-sm scale-[1.02]'
                : 'text-txt-sec hover:text-primary hover:bg-elevated'
            }`
          }
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: accentColor, color: accentTextColor }
              : undefined
          }
        >
          <Compass size={20} /> Explore
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              isActive
                ? 'shadow-sm scale-[1.02]'
                : 'text-txt-sec hover:text-primary hover:bg-elevated'
            }`
          }
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: accentColor, color: accentTextColor }
              : undefined
          }
        >
          <Library size={20} /> Your Library
        </NavLink>
      </nav>

      {/* Discover */}
      <div className="mt-8 px-6">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[11px] font-space font-bold uppercase tracking-widest" style={{ color: accentColor }}>Discover</p>
          <SquiggleLineSVG color={accentColor} className="w-6 h-auto opacity-70" />
        </div>
        <div className="space-y-3.5 text-sm font-medium">
          <NavLink
            to="/discover/trending"
            className={({ isActive }) =>
              `flex items-center gap-3 cursor-pointer transition-colors group select-none ${
                isActive ? 'font-bold' : 'text-txt-sec hover:text-primary'
              }`
            }
            style={({ isActive }) => (isActive ? { color: accentColor } : undefined)}
          >
            <TrendingUp size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Trending
          </NavLink>

          <NavLink
            to="/discover/new-releases"
            className={({ isActive }) =>
              `flex items-center gap-3 cursor-pointer transition-colors group select-none ${
                isActive ? 'font-bold' : 'text-txt-sec hover:text-primary'
              }`
            }
            style={({ isActive }) => (isActive ? { color: accentColor } : undefined)}
          >
            <Star size={18} className="group-hover:scale-110 transition-transform" /> New Releases
          </NavLink>

          <NavLink
            to="/discover/top-charts"
            className={({ isActive }) =>
              `flex items-center gap-3 cursor-pointer transition-colors group select-none ${
                isActive ? 'font-bold' : 'text-txt-sec hover:text-primary'
              }`
            }
            style={({ isActive }) => (isActive ? { color: accentColor } : undefined)}
          >
            <BarChart3 size={18} className="group-hover:scale-110 transition-transform" /> Top Charts
          </NavLink>

          <NavLink
            to="/discover/genres"
            className={({ isActive }) =>
              `flex items-center gap-3 cursor-pointer transition-colors group select-none ${
                isActive ? 'font-bold' : 'text-txt-sec hover:text-primary'
              }`
            }
            style={({ isActive }) => (isActive ? { color: accentColor } : undefined)}
          >
            <Headphones size={18} className="group-hover:scale-110 transition-transform" /> Genres &amp; Moods
          </NavLink>
        </div>
      </div>

      {/* Your Library / Playlists */}
      <div className="mt-8 px-6 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-space font-bold uppercase tracking-widest" style={{ color: accentColor }}>Playlists</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-txt-muted hover:text-primary transition-colors p-1"
            title="Create playlist"
            aria-label="Create playlist"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-3 text-sm font-medium pb-4">
          {playlistsToDisplay.map((pl, i) => (
            <NavLink
              key={pl._id || i}
              to={pl._id ? `/playlist/${pl._id}` : '#'}
              onClick={(e) => {
                if (!pl._id) {
                  e.preventDefault();
                  handlePlaylistClick(pl);
                }
              }}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 cursor-pointer transition-colors group select-none py-0.5 ${
                  isActive ? 'font-bold' : 'text-txt-sec hover:text-primary'
                }`
              }
              style={({ isActive }) => (isActive ? { color: accentColor } : undefined)}
              title={pl.songs?.length ? `${pl.name} (${pl.songs.length} songs)` : pl.name}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform shadow-sm"
                  style={{ backgroundColor: pl.color }}
                />
                <span className="truncate">{pl.name}</span>
              </div>
              {pl.songs?.length > 0 && (
                <span className="text-[10px] font-space text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  {pl.songs.length}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Profile */}
      <div
        onClick={() => navigate('/profile')}
        className="p-5 border-t border-brd flex items-center gap-4 cursor-pointer hover:bg-elevated transition-colors bg-sidebar group"
        title="View Profile"
      >
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-brd group-hover:border-primary transition-colors"
            alt={user.username || 'Profile'}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm font-space shadow-sm border border-brd group-hover:border-primary transition-colors"
            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
          >
            {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-txt truncate font-space group-hover:text-primary transition-colors">
            {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : user?.username}
          </p>
          <p className="text-[11px] font-semibold flex items-center gap-1.5 text-txt-sec">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            {user?.role === 'artist' ? 'Artist' : 'Listener'}
          </p>
        </div>
        <button
          id="logout-button"
          onClick={(e) => {
            e.stopPropagation();
            logout();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-txt-muted hover:text-txt hover:bg-bg transition-colors"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <CreatePlaylistModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </aside>
  );
}

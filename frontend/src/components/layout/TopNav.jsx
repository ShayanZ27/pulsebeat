import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Command,
  ListMusic,
  Menu,
  Moon,
  Palette,
  Search,
  Sun,
  X,
  Play,
  Music2,
  Disc,
  Mic2,
} from 'lucide-react';
import { ACCENT_THEMES } from '../../constants/theme';
import { useClickOutside } from '../../hooks/useClickOutside';
import {
  selectAccentColor,
  selectAccentTextColor,
  selectIsDark,
  selectSelectedTheme,
  setAccent,
  toggleDark,
} from '../../store/themeSlice';
import { playSingleTrack, playTracks, selectCurrentTrack, selectIsPlaying } from '../../store/playerSlice';
import { HeartbeatLoader, PlayingOverlay } from '../common/PulseAnimations';
import { useSearchQuery, useRecordPlayMutation } from '../../store/api';
import TrackActionMenu from '../common/TrackActionMenu';
import AddToPlaylistModal from '../common/AddToPlaylistModal';
import { contrastText } from '../../utils/color';
import { formatTime } from '../../utils/format';
import { selectCurrentUser } from '../../store/authSlice';

export default function TopNav({
  isLargeDesktop = false,
  onToggleRightPanel,
  onOpenMobileMenu,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const accentColor = useSelector(selectAccentColor);
  const accentTextColor = useSelector(selectAccentTextColor);
  const selectedTheme = useSelector(selectSelectedTheme);
  const isDark = useSelector(selectIsDark);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [playlistModalItem, setPlaylistModalItem] = useState(null);
  const [playlistModalType, setPlaylistModalType] = useState('track');
  const colorPickerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [recordPlay] = useRecordPlayMutation();

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Global shortcut: Ctrl+K or Cmd+K focuses search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: searchResults, isFetching: isSearching } = useSearchQuery(
    { query: debouncedQuery, type: 'all' },
    { skip: !debouncedQuery }
  );

  useClickOutside(colorPickerRef, () => setShowColorPicker(false), showColorPicker);
  useClickOutside(searchContainerRef, () => setSearchFocused(false), searchFocused);

  const hasResults =
    searchResults &&
    (searchResults.music?.length > 0 ||
      searchResults.artists?.length > 0 ||
      searchResults.albums?.length > 0 ||
      searchResults.playlists?.length > 0);

  const handlePlaySong = (song) => {
    dispatch(playSingleTrack(song));
    if (song?._id && !String(song._id).startsWith('sample-')) {
      recordPlay(song._id).catch(() => {});
    }
    setSearchFocused(false);
  };

  const handleSelectArtist = (artist) => {
    setSearchFocused(false);
    navigate(`/artist/${artist._id}`);
  };

  const handleSelectAlbum = (album) => {
    setSearchFocused(false);
    navigate(`/album/${album._id}`);
  };

  const handleSelectPlaylist = (playlist) => {
    setSearchFocused(false);
    navigate(`/playlist/${playlist._id}`);
  };

  return (
    <header className="flex items-center justify-between px-6 md:px-10 h-24 shrink-0 z-30">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobileMenu}
        className="md:hidden text-txt mr-4"
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* Search */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xl group">
        <Search
          size={18}
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10 ${
            searchFocused ? 'text-primary' : 'text-txt-muted'
          }`}
          style={{ color: searchFocused ? accentColor : undefined }}
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for songs, artists, albums..."
          onFocus={() => setSearchFocused(true)}
          className="w-full bg-sidebar border-2 border-transparent text-txt text-sm rounded-xl py-3 pl-12 pr-20 outline-none transition-all placeholder:text-txt-muted shadow-sm hover:shadow-md"
          style={{ borderColor: searchFocused ? accentColor : 'var(--border-color)' }}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-80 z-10">
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              className="p-1 text-txt-muted hover:text-txt rounded-full"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center justify-center h-7 px-2.5 text-xs font-space font-bold text-txt-sec bg-elevated border border-brd rounded-lg shadow-sm">
            <Command size={12} className="mr-1" /> K
          </kbd>
        </div>

        {/* Search Results Dropdown */}
        {searchFocused && debouncedQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-sidebar/95 backdrop-blur-2xl border border-brd rounded-2xl shadow-2xl p-4 z-50 max-h-115 overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <HeartbeatLoader size={20} text="Searching PulseBeat..." color={accentColor} />
              </div>
            ) : !hasResults ? (
              <div className="text-center py-8 text-txt-muted text-xs font-space">
                No results found for "{debouncedQuery}"
              </div>
            ) : (
              <>
                {/* Songs */}
                {searchResults.music?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-space font-bold uppercase tracking-wider text-txt-muted mb-2 px-2">
                      Songs
                    </p>
                    <div className="space-y-1">
                      {searchResults.music.slice(0, 5).map((song) => {
                        const isThisPlaying = currentTrack?._id === song._id && isPlaying;
                        return (
                          <div
                            key={song._id}
                            onClick={() => handlePlaySong(song)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-elevated transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 shadow-sm bg-elevated">
                                <img
                                  src={song.coverImage || 'https://picsum.photos/seed/track/60/60'}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                {isThisPlaying && (
                                  <PlayingOverlay size={16} rounded="rounded-lg" color={accentColor} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="text-xs font-bold truncate group-hover:text-primary transition-colors"
                                  style={isThisPlaying ? { color: accentColor } : undefined}
                                >
                                  {song.title}
                                </p>
                                <p className="text-[11px] text-txt-sec truncate">
                                  {song.artist?.firstName
                                    ? `${song.artist.firstName} ${song.artist.lastName || ''}`.trim()
                                    : song.artist?.username || 'Artist'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-space text-txt-muted mr-1">
                              {formatTime(song.duration)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePlaySong(song)}
                              className="p-1.5 rounded-full bg-elevated hover:bg-primary hover:text-bg text-txt-muted transition-colors cursor-pointer"
                              title="Play"
                            >
                              <Play size={12} className="fill-current" />
                            </button>
                            <TrackActionMenu
                              item={song}
                              itemType="track"
                              buttonSize={28}
                              iconSize={14}
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
                )}

                {/* Artists */}
                {searchResults.artists?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-space font-bold uppercase tracking-wider text-txt-muted mb-2 px-2">
                      Artists
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {searchResults.artists.slice(0, 4).map((artist) => (
                        <div
                          key={artist._id}
                          onClick={() => handleSelectArtist(artist)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-elevated transition-colors cursor-pointer group"
                        >
                          <img
                            src={artist.profilePicture || 'https://picsum.photos/seed/artist/80/80'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm"
                          />
                          <p className="text-xs font-bold text-txt truncate group-hover:text-primary transition-colors">
                            {artist.firstName
                              ? `${artist.firstName} ${artist.lastName || ''}`.trim()
                              : artist.username}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Albums */}
                {searchResults.albums?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-space font-bold uppercase tracking-wider text-txt-muted mb-2 px-2">
                      Albums
                    </p>
                    <div className="space-y-1">
                      {searchResults.albums.slice(0, 3).map((album) => (
                        <div
                          key={album._id}
                          onClick={() => handleSelectAlbum(album)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-elevated transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <img
                              src={album.coverImage || 'https://picsum.photos/seed/album/60/60'}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-txt truncate group-hover:text-primary transition-colors">
                                {album.title}
                              </p>
                              <p className="text-[11px] text-txt-sec truncate">
                                Album • {album.artist?.firstName
                                  ? `${album.artist.firstName} ${album.artist.lastName || ''}`.trim()
                                  : album.artist?.username || 'Artist'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <TrackActionMenu
                              item={album}
                              itemType="album"
                              buttonSize={28}
                              iconSize={14}
                              onOpenPlaylistModal={(albumItem) => {
                                setPlaylistModalItem(albumItem);
                                setPlaylistModalType('album');
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Playlists */}
                {searchResults.playlists?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-space font-bold uppercase tracking-wider text-txt-muted mb-2 px-2">
                      Playlists
                    </p>
                    <div className="space-y-1">
                      {searchResults.playlists.slice(0, 3).map((pl) => (
                        <div
                          key={pl._id}
                          onClick={() => handleSelectPlaylist(pl)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-elevated transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center shrink-0">
                              <Music2 size={16} className="text-txt-muted" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-txt truncate group-hover:text-primary transition-colors">
                                {pl.name}
                              </p>
                              <p className="text-[11px] text-txt-sec truncate">
                                By {pl.owner?.firstName
                                  ? `${pl.owner.firstName} ${pl.owner.lastName || ''}`.trim()
                                  : pl.owner?.username || 'User'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <TrackActionMenu
                              item={pl}
                              itemType="playlist"
                              buttonSize={28}
                              iconSize={14}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 ml-6">
        {/* Theme Color Picker */}
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-elevated transition-colors text-txt-sec hover:text-primary"
            title="Change theme color"
            aria-label="Change theme color"
          >
            <Palette size={20} style={{ color: showColorPicker ? accentColor : undefined }} />
          </button>
          {showColorPicker && (
            <div className="absolute right-0 top-full mt-3 bg-sidebar border-2 border-brd rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 z-50 w-65 animate-in fade-in slide-in-from-top-4 duration-200">
              <p className="text-sm font-space font-bold text-txt mb-4">Accent Theme</p>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(ACCENT_THEMES).map(([name, hex]) => (
                  <button
                    key={name}
                    onClick={() => {
                      dispatch(setAccent(hex));
                      setShowColorPicker(false);
                    }}
                    className="relative w-8 h-8 rounded-full border-2 hover:scale-125 active:scale-95 transition-all flex items-center justify-center shadow-sm overflow-hidden"
                    style={{
                      backgroundColor: name === 'white' ? 'transparent' : hex,
                      borderColor: selectedTheme === hex ? 'var(--text-primary)' : 'transparent',
                    }}
                    title={name === 'white' ? 'Monochrome' : name}
                  >
                    {name === 'white' && (
                      <div
                        className="absolute inset-0 w-full h-full"
                        style={{ background: 'linear-gradient(135deg, #E5E7EB 50%, #111827 50%)' }}
                      />
                    )}
                    {selectedTheme === hex && (
                      <span
                        className="relative z-10"
                        style={{ color: name === 'white' ? '#888888' : contrastText(hex), fontSize: 12, fontWeight: 900 }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Toggle */}
        <button
          onClick={() => dispatch(toggleDark())}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-elevated transition-colors text-txt-sec hover:text-primary"
          title="Toggle dark/light mode"
          aria-label="Toggle dark/light mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full overflow-hidden border border-brd shadow-sm ml-2 cursor-pointer hover:border-primary transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0"
          title={`Profile (${user?.username || 'Listener'})`}
          aria-label="View user profile"
        >
          {user?.profilePicture ? (
            <img src={user.profilePicture} className="w-full h-full object-cover" alt="Avatar" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-sm font-space"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </div>
          )}
        </button>

        {/* Right panel toggle (medium desktop + mobile) */}
        {!isLargeDesktop && (
          <button
            onClick={onToggleRightPanel}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-elevated transition-colors text-txt-sec hover:text-primary ml-2"
            title="Toggle queue and activity panel"
            aria-label="Toggle queue and activity panel"
          >
            <ListMusic size={20} />
          </button>
        )}
      </div>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(playlistModalItem)}
        onClose={() => setPlaylistModalItem(null)}
        item={playlistModalItem}
        itemType={playlistModalType}
      />
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Music2,
  Disc,
  ListMusic,
  Search,
  ExternalLink,
  Play,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  useGetAdminFeaturedQuery,
  useAddAdminFeaturedMutation,
  useRemoveAdminFeaturedMutation,
  useReorderAdminFeaturedMutation,
  useSearchQuery,
} from '../../store/api';
import { getDisplayName } from '../../utils/format';
import { showToast } from '../../utils/toast';

export default function AdminFeaturedTab({ accentColor, accentTextColor }) {
  const { data: featuredItems = [], isLoading, refetch } = useGetAdminFeaturedQuery();
  const [addAdminFeatured, { isLoading: adding }] = useAddAdminFeaturedMutation();
  const [removeAdminFeatured, { isLoading: removing }] = useRemoveAdminFeaturedMutation();
  const [reorderAdminFeatured, { isLoading: reordering }] = useReorderAdminFeaturedMutation();

  const [showAddModal, setShowAddModal] = useState(false);

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featuredItems.length) return;

    const newItems = [...featuredItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const payload = newItems.map((item, idx) => ({
      id: item._id,
      contentType: item.contentType,
      featuredOrder: idx,
    }));

    try {
      await reorderAdminFeatured(payload).unwrap();
      showToast.success('Featured order updated');
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || 'Failed to reorder items');
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeAdminFeatured({
        contentId: item._id,
        contentType: item.contentType,
      }).unwrap();
      showToast.success(`Unpinned "${item.title || item.name}" from featured`);
      refetch();
    } catch (err) {
      showToast.error(err?.data?.message || 'Failed to unpin item');
    }
  };

  const getItemBadge = (type) => {
    switch (type) {
      case 'album':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-space font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Disc size={12} /> Album
          </span>
        );
      case 'playlist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-space font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ListMusic size={12} /> Playlist
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-space font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Music2 size={12} /> Track
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-sidebar border border-brd shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
            <Sparkles size={14} style={{ color: accentColor }} />
            <span>Homepage Hero Showcase</span>
          </div>
          <h2 className="text-xl md:text-2xl font-playfair font-black text-txt">
            Featured Content Slides
          </h2>
          <p className="text-xs md:text-sm text-txt-sec">
            Items pinned here take priority in the 5-slot Hero Showcase carousel on the homepage.
            Unpinned slots are automatically backfilled by algorithmic trending tracks and albums.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-space font-bold shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          style={{ backgroundColor: accentColor, color: accentTextColor }}
        >
          <Plus size={16} /> Pin New Content
        </button>
      </div>

      {/* Featured Items List */}
      <div className="bg-sidebar rounded-3xl border border-brd overflow-hidden shadow-sm">
        <div className="p-4 px-6 border-b border-brd flex items-center justify-between">
          <span className="text-xs font-space font-bold uppercase tracking-wider text-txt-muted">
            Currently Pinned ({featuredItems.length} / 5 slots recommended)
          </span>
          <span className="text-xs text-txt-muted font-space">
            Order determines position on homepage carousel
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-elevated animate-pulse border border-brd/40" />
            ))}
          </div>
        ) : featuredItems.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-elevated flex items-center justify-center mx-auto mb-4 text-txt-muted border border-brd">
              <Sparkles size={28} style={{ color: accentColor }} />
            </div>
            <h3 className="text-lg font-bold text-txt mb-1">No Content Manually Pinned</h3>
            <p className="text-xs text-txt-sec max-w-md mx-auto mb-6">
              The homepage showcase is currently running on automatic trending algorithms. Pin your favorite tracks, albums, or public playlists to highlight them.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-full text-xs font-space font-bold border border-brd bg-elevated hover:bg-sidebar text-txt hover:text-primary transition-all cursor-pointer shadow-sm"
              style={{ color: accentColor }}
            >
              + Pin First Item
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brd/60">
            {featuredItems.map((item, idx) => {
              const title = item.title || item.name || 'Untitled';
              const artistName = item.artist
                ? getDisplayName(item.artist, 'Artist')
                : item.owner
                ? getDisplayName(item.owner, 'Curator')
                : 'PulseBeat';
              const cover = item.coverImage || (item.songs?.[0]?.coverImage) || 'https://picsum.photos/seed/slide/200/200';

              return (
                <div
                  key={item._id || idx}
                  className="p-4 px-6 flex items-center justify-between gap-4 hover:bg-elevated/50 transition-colors group"
                >
                  {/* Left: Position & Artwork & Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className="w-8 text-center font-space font-black text-sm text-txt-muted"
                      style={{ color: accentColor }}
                    >
                      #{idx + 1}
                    </span>

                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-elevated border border-brd shadow-xs">
                      <img src={cover} alt={title} className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getItemBadge(item.contentType)}
                        <h4 className="text-sm font-bold text-txt truncate group-hover:text-primary transition-colors">
                          {title}
                        </h4>
                      </div>
                      <p className="text-xs text-txt-sec truncate">
                        {artistName}
                        {item.contentType === 'album' && item.songs?.length ? ` • ${item.songs.length} songs` : ''}
                        {item.contentType === 'playlist' && item.songs?.length ? ` • ${item.songs.length} tracks` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (Up, Down, Unpin) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-sidebar rounded-xl border border-brd p-0.5 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0 || reordering}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-txt-sec hover:text-txt hover:bg-elevated disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === featuredItems.length - 1 || reordering}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-txt-sec hover:text-txt hover:bg-elevated disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      disabled={removing}
                      className="w-9 h-9 rounded-xl bg-sidebar hover:bg-red-500/10 border border-brd hover:border-red-500/30 text-txt-sec hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      title="Unpin from Featured"
                      aria-label="Unpin from Featured"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pin New Content Modal */}
      {showAddModal && (
        <PinContentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refetch();
          }}
          accentColor={accentColor}
          accentTextColor={accentTextColor}
          currentlyPinnedIds={new Set(featuredItems.map((i) => String(i._id)))}
        />
      )}
    </div>
  );
}

function PinContentModal({ isOpen, onClose, onSuccess, accentColor, accentTextColor, currentlyPinnedIds }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' | 'albums' | 'playlists'
  const [addAdminFeatured, { isLoading: adding }] = useAddAdminFeaturedMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isFetching: searching } = useSearchQuery(
    { query: debouncedTerm, type: 'all' },
    { skip: !debouncedTerm || debouncedTerm.length < 2 }
  );

  const tracks = searchResults?.music || [];
  const albums = searchResults?.albums || [];
  const playlists = searchResults?.playlists || [];

  // If active tab has no results but another tab does, auto-switch to the tab with results
  useEffect(() => {
    if (debouncedTerm.length >= 2 && searchResults) {
      if (activeTab === 'tracks' && tracks.length === 0) {
        if (albums.length > 0) setActiveTab('albums');
        else if (playlists.length > 0) setActiveTab('playlists');
      } else if (activeTab === 'albums' && albums.length === 0) {
        if (tracks.length > 0) setActiveTab('tracks');
        else if (playlists.length > 0) setActiveTab('playlists');
      } else if (activeTab === 'playlists' && playlists.length === 0) {
        if (tracks.length > 0) setActiveTab('tracks');
        else if (albums.length > 0) setActiveTab('albums');
      }
    }
  }, [searchResults, debouncedTerm]);

  const handlePin = async (item, type) => {
    try {
      await addAdminFeatured({ contentId: item._id, contentType: type }).unwrap();
      showToast.success(`Pinned "${item.title || item.name}" to Hero Showcase`);
      onSuccess();
    } catch (err) {
      showToast.error(err?.data?.message || 'Failed to pin item');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-sidebar rounded-3xl border border-brd shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-brd flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-elevated flex items-center justify-center text-primary" style={{ color: accentColor }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-txt">Pin Content to Hero Showcase</h3>
              <p className="text-xs text-txt-sec">Search and select items to feature on the homepage</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-elevated hover:bg-elevated/80 text-txt-sec hover:text-txt flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-3 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tracks, albums, or playlists..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-elevated border border-brd text-txt text-sm placeholder:text-txt-muted focus:outline-none focus:border-primary transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt cursor-pointer"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: 'tracks', label: `Tracks (${tracks.length})`, icon: Music2 },
              { id: 'albums', label: `Albums (${albums.length})`, icon: Disc },
              { id: 'playlists', label: `Playlists (${playlists.length})`, icon: ListMusic },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'shadow-sm'
                      : 'text-txt-sec hover:text-txt hover:bg-elevated'
                  }`}
                  style={isActive ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-brd/50">
          {!debouncedTerm ? (
            <div className="py-14 text-center text-txt-muted text-xs">
              Type in the search box to find items to feature.
            </div>
          ) : debouncedTerm.length < 2 ? (
            <div className="py-14 text-center text-txt-muted text-xs">
              Type at least 2 characters to search.
            </div>
          ) : searching ? (
            <div className="py-14 text-center text-txt-muted text-xs flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
              <span>Searching database...</span>
            </div>
          ) : (
            <>
              {activeTab === 'tracks' && (
                tracks.length === 0 ? (
                  <div className="py-12 text-center text-txt-muted text-xs">No matching tracks found.</div>
                ) : (
                  tracks.map((song) => {
                    const isPinned = currentlyPinnedIds.has(String(song._id));
                    return (
                      <div key={song._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={song.coverImage || 'https://picsum.photos/seed/track/80/80'}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover bg-elevated shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-txt truncate">{song.title}</p>
                            <p className="text-xs text-txt-sec truncate">{getDisplayName(song.artist, 'Artist')}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isPinned || adding}
                          onClick={() => handlePin(song, 'music')}
                          className={`px-4 py-2 rounded-xl text-xs font-space font-bold transition-all shrink-0 cursor-pointer ${
                            isPinned
                              ? 'bg-elevated text-txt-muted border border-brd cursor-not-allowed'
                              : 'shadow-sm hover:scale-105 active:scale-95'
                          }`}
                          style={!isPinned ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                        >
                          {isPinned ? 'Already Pinned' : '+ Pin Track'}
                        </button>
                      </div>
                    );
                  })
                )
              )}

              {activeTab === 'albums' && (
                albums.length === 0 ? (
                  <div className="py-12 text-center text-txt-muted text-xs">No matching albums found.</div>
                ) : (
                  albums.map((album) => {
                    const isPinned = currentlyPinnedIds.has(String(album._id));
                    return (
                      <div key={album._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={album.coverImage || 'https://picsum.photos/seed/album/80/80'}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover bg-elevated shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-txt truncate">{album.title}</p>
                            <p className="text-xs text-txt-sec truncate">{getDisplayName(album.artist, 'Artist')}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isPinned || adding}
                          onClick={() => handlePin(album, 'album')}
                          className={`px-4 py-2 rounded-xl text-xs font-space font-bold transition-all shrink-0 cursor-pointer ${
                            isPinned
                              ? 'bg-elevated text-txt-muted border border-brd cursor-not-allowed'
                              : 'shadow-sm hover:scale-105 active:scale-95'
                          }`}
                          style={!isPinned ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                        >
                          {isPinned ? 'Already Pinned' : '+ Pin Album'}
                        </button>
                      </div>
                    );
                  })
                )
              )}

              {activeTab === 'playlists' && (
                playlists.length === 0 ? (
                  <div className="py-12 text-center text-txt-muted text-xs">No matching playlists found.</div>
                ) : (
                  playlists.map((playlist) => {
                    const isPinned = currentlyPinnedIds.has(String(playlist._id));
                    return (
                      <div key={playlist._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={playlist.coverImage || (playlist.songs?.[0]?.coverImage) || 'https://picsum.photos/seed/playlist/80/80'}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover bg-elevated shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-txt truncate">{playlist.name || playlist.title}</p>
                            <p className="text-xs text-txt-sec truncate">{getDisplayName(playlist.owner, 'Curator')}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isPinned || adding}
                          onClick={() => handlePin(playlist, 'playlist')}
                          className={`px-4 py-2 rounded-xl text-xs font-space font-bold transition-all shrink-0 cursor-pointer ${
                            isPinned
                              ? 'bg-elevated text-txt-muted border border-brd cursor-not-allowed'
                              : 'shadow-sm hover:scale-105 active:scale-95'
                          }`}
                          style={!isPinned ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                        >
                          {isPinned ? 'Already Pinned' : '+ Pin Playlist'}
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-brd bg-elevated/40 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-space font-bold bg-sidebar border border-brd text-txt hover:bg-elevated transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

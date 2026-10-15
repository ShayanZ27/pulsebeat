import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell,
  Command,
  ListMusic,
  Menu,
  Moon,
  Palette,
  Search,
  Sun,
} from 'lucide-react';
import { ACCENT_THEMES } from '../../constants/theme';
import { useClickOutside } from '../../hooks/useClickOutside';
import {
  selectAccentColor,
  selectIsDark,
  selectSelectedTheme,
  setAccent,
  toggleDark,
} from '../../store/themeSlice';
import { contrastText } from '../../utils/color';

export default function TopNav({
  isLargeDesktop = false,
  onToggleRightPanel,
  onOpenMobileMenu,
}) {
  const dispatch = useDispatch();
  const accentColor = useSelector(selectAccentColor);
  const selectedTheme = useSelector(selectSelectedTheme);
  const isDark = useSelector(selectIsDark);

  const [searchFocused, setSearchFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);

  useClickOutside(colorPickerRef, () => setShowColorPicker(false), showColorPicker);

  return (
    <header className="flex items-center justify-between px-6 md:px-10 h-24 flex-shrink-0 z-20">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobileMenu}
        className="md:hidden text-txt mr-4"
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xl group">
        <Search
          size={18}
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-primary' : 'text-txt-muted'}`}
          style={{ color: searchFocused ? accentColor : undefined }}
        />
        <input
          type="text"
          placeholder="Search for songs, artists, albums..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full bg-sidebar border-2 border-transparent text-txt text-sm rounded-xl py-3 pl-12 pr-20 outline-none transition-all placeholder:text-txt-muted shadow-sm hover:shadow-md"
          style={{ borderColor: searchFocused ? accentColor : 'var(--border-color)' }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-80">
          <kbd className="hidden sm:inline-flex items-center justify-center h-7 px-2.5 text-xs font-space font-bold text-txt-sec bg-elevated border border-brd rounded-lg shadow-sm">
            <Command size={12} className="mr-1" /> K
          </kbd>
        </div>
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
            <div className="absolute right-0 top-full mt-3 bg-sidebar border-2 border-brd rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 z-50 w-[260px] animate-in fade-in slide-in-from-top-4 duration-200">
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

        {/* Notifications */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-elevated transition-colors text-txt-sec hover:text-primary relative"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-bg" style={{ backgroundColor: accentColor }}></span>
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden border border-brd shadow-sm ml-2 cursor-pointer hover:border-primary transition-colors">
          <img src="https://picsum.photos/seed/userprofile/48/48" className="w-full h-full object-cover" alt="Avatar" />
        </div>

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
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { Home, Search, Library } from 'lucide-react';
import { selectAccentColor } from '../../store/themeSlice';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import RightPanel from './RightPanel';
import PlayerBar from '../player/PlayerBar';
import ToastContainer from '../common/ToastContainer';

export default function AppShell() {
  const accentColor = useSelector(selectAccentColor);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isLargeDesktop = windowWidth >= 1440;
  const isMobile = windowWidth < 1024;

  return (
    <div className="flex flex-col h-screen bg-bg text-txt overflow-hidden select-none font-inter transition-colors duration-300">
      {/* ══════ TOP AREA: Sidebar + Content + Right Panel ══════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── LEFT SIDEBAR ─── */}
        <Sidebar />

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-bg relative">
          {/* Top Header Bar */}
          <TopNav
            isLargeDesktop={isLargeDesktop}
            onToggleRightPanel={() => setRightPanelOpen((prev) => !prev)}
          />

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-8 scrollbar-hide z-10">
            <Outlet />
          </div>
        </main>

        {/* ─── RIGHT PANEL ─── */}
        <RightPanel
          isLargeDesktop={isLargeDesktop}
          isMobile={isMobile}
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      </div>

      {/* ══════ BOTTOM PLAYER ══════ */}
      <PlayerBar onToggleRightPanel={() => setRightPanelOpen((prev) => !prev)} />

      {/* ══════ MOBILE BOTTOM NAV ══════ */}
      <div className="md:hidden flex items-center justify-around bg-sidebar border-t border-brd py-3 z-30 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button
          className="flex flex-col items-center gap-1"
          style={{ color: accentColor }}
          aria-label="Home"
        >
          <Home size={24} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-txt-muted hover:text-primary transition-colors"
          aria-label="Search"
        >
          <Search size={24} />
          <span className="text-[10px] font-bold">Search</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 text-txt-muted hover:text-primary transition-colors"
          aria-label="Library"
        >
          <Library size={24} />
          <span className="text-[10px] font-bold">Library</span>
        </button>
      </div>

      {/* ══════ TOAST NOTIFICATIONS ══════ */}
      <ToastContainer />
    </div>
  );
}

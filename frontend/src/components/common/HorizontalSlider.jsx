import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * HorizontalSlider component for homepage shelves and rows.
 * Features:
 * - Header Chevron buttons (left / right) with auto-disable at edges
 * - Floating side chevron buttons on hover
 * - Smooth scroll & click-and-drag mouse support
 * - Dynamic scroll bounds detection with ResizeObserver
 */
export default function HorizontalSlider({
  title,
  icon,
  badge,
  viewAllLink,
  onViewAll,
  viewAllText = 'View all',
  accentColor,
  children,
  className = '',
  itemGap = 'gap-6',
}) {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const checkScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkScroll();
      });
      ro.observe(el);
      Array.from(el.children).forEach((child) => ro.observe(child));
    }

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      if (ro) ro.disconnect();
    };
  }, [checkScroll, children]);

  const slide = (direction) => {
    const el = sliderRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 260);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only main click
    const el = sliderRef.current;
    if (!el) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - el.offsetLeft);
    setInitialScrollLeft(el.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const el = sliderRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.25;
    if (Math.abs(walk) > 6) {
      setHasDragged(true);
    }
    el.scrollLeft = initialScrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      // Small timeout to let click-capture prevent accidental navigation
      setTimeout(() => setHasDragged(false), 50);
    }
  };

  const handleClickCapture = (e) => {
    if (hasDragged) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    } else if (viewAllLink) {
      navigate(viewAllLink);
    }
  };

  return (
    <section className={`mb-14 ${className}`}>
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {title && (
            <h2 className="text-[26px] font-space font-bold text-txt tracking-tight">
              {title}
            </h2>
          )}
          {icon}
          {badge}
        </div>

        {/* Header Right Actions: View All + Slider Controls */}
        <div className="flex items-center gap-3">
          {(viewAllLink || onViewAll) && (
            <button
              type="button"
              onClick={handleViewAllClick}
              className="text-sm font-bold hover:underline transition-opacity cursor-pointer bg-transparent border-none p-0"
              style={{ color: accentColor }}
            >
              {viewAllText}
            </button>
          )}

          {/* Slider Prev / Next Controls */}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={() => slide('left')}
              disabled={!canScrollLeft}
              aria-label={`Slide ${title || 'row'} left`}
              className="w-8 h-8 rounded-full bg-sidebar border border-brd text-txt-sec hover:text-txt hover:bg-elevated flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => slide('right')}
              disabled={!canScrollRight}
              aria-label={`Slide ${title || 'row'} right`}
              className="w-8 h-8 rounded-full bg-sidebar border border-brd text-txt-sec hover:text-txt hover:bg-elevated flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Slider Row Container with Floating Edge Controls on Hover ── */}
      <div className="relative group/slider">
        {/* Floating Left Arrow (visible on row hover when scrollable, clean without tint) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => slide('left')}
            aria-label="Slide left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-sidebar/95 hover:bg-elevated text-txt hover:text-primary border border-brd shadow-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover/slider:opacity-100 cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-md"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Floating Right Arrow (visible on row hover when scrollable, clean without tint) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => slide('right')}
            aria-label="Slide right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-sidebar/95 hover:bg-elevated text-txt hover:text-primary border border-brd shadow-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover/slider:opacity-100 cursor-pointer hover:scale-110 active:scale-95 backdrop-blur-md"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Scrolling Items */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
          className={`flex ${itemGap} overflow-x-auto scrollbar-hide scroll-smooth py-4 -mt-4 -mx-3 px-3 select-none ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

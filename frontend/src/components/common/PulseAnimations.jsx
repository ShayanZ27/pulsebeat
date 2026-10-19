import React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PulseBeat Centralized Animations & Indicators
 * ═══════════════════════════════════════════════════════════════════════════════
 * All playback and loading animations are unified here so they can be easily
 * tuned or modified in one single place.
 *
 * Included components:
 * 1. PlayingHeartbeat: Signature animated EKG mark (now playing)
 * 2. PlayingOverlay: Dark frosted glass overlay for playing song avatars & cards
 * 3. HeartbeatLoader: Custom heartbeat/EKG style loader (inline & block variants)
 * 4. HeartbeatIndicator: Alias for PlayingHeartbeat (backward compatibility)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Global Animation Settings (tweak these anytime to adjust the rhythm across the entire app)
export const PULSE_CONFIG = {
  playingDuration: '1.15s',
  loaderDuration: '1.2s',
  defaultAccent: 'var(--accent-color, #C6F24E)',
};

/**
 * Embedded stylesheet ensures animations work anywhere without depending on
 * external class names, while allowing instant hot-reload tuning.
 */
const AnimationStyles = () => (
  <style>{`
    @keyframes pbTraceKey {
      0% { stroke-dashoffset: 100; }
      100% { stroke-dashoffset: -100; }
    }
    @keyframes pbBeatKey {
      0%, 100% { transform: scale(1); opacity: 0.85; }
      14% { transform: scale(1.7); opacity: 1; }
      28% { transform: scale(1); }
      42% { transform: scale(1.4); opacity: 1; }
      70% { transform: scale(1); }
    }
    @keyframes pbHaloKey {
      0% { transform: scale(0.85); opacity: 0.55; }
      100% { transform: scale(1.9); opacity: 0; }
    }
    @keyframes pbLoaderKey {
      0% { stroke-dashoffset: 100; }
      100% { stroke-dashoffset: -100; }
    }
    @keyframes pbLoaderThrobKey {
      0%, 100% { transform: scale(0.9); opacity: 0.5; }
      25% { transform: scale(1.45); opacity: 1; }
      50% { transform: scale(1); opacity: 0.8; }
      75% { transform: scale(1.3); opacity: 1; }
    }
    @keyframes pbPulseGlowKey {
      0%, 100% { opacity: 0.35; transform: scale(0.95); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    .pb-anim-trace {
      stroke-dasharray: 55 45;
      animation: pbTraceKey ${PULSE_CONFIG.playingDuration} linear infinite;
      transition: none;
    }
    .pb-anim-dot {
      transform-box: fill-box;
      transform-origin: center;
      animation: pbBeatKey ${PULSE_CONFIG.playingDuration} ease-in-out infinite;
      transition: none;
    }
    .pb-anim-halo {
      animation: pbHaloKey ${PULSE_CONFIG.playingDuration} ease-out infinite;
    }
    .pb-loader-trace {
      stroke-dasharray: 50 50;
      animation: pbLoaderKey ${PULSE_CONFIG.loaderDuration} linear infinite;
      transition: none;
    }
    .pb-loader-dot {
      transform-box: fill-box;
      transform-origin: center;
      animation: pbLoaderThrobKey ${PULSE_CONFIG.loaderDuration} ease-in-out infinite;
      transition: none;
    }
    .pb-scope-glow {
      animation: pbPulseGlowKey 1.8s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .pb-anim-trace, .pb-anim-dot, .pb-anim-halo,
      .pb-loader-trace, .pb-loader-dot, .pb-scope-glow {
        animation: none !important;
        stroke-dasharray: none !important;
      }
    }
  `}</style>
);

/**
 * 1. PlayingHeartbeat
 * PulseBeat's signature "now playing" mark: the logo's EKG line with an electrical pulse
 * sweeping across it and a beating dot at the end. Uses the exact LogoPulseSVG path.
 */
export function PlayingHeartbeat({
  color,
  size = 18,
  className = '',
  showHalo = true,
}) {
  const activeColor = color || PULSE_CONFIG.defaultAccent;

  return (
    <span className={`inline-flex items-center justify-center shrink-0 relative ${className}`}>
      <AnimationStyles />
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label="Now playing"
        className="overflow-visible"
      >
        {/* Faint base line for depth */}
        <path
          d="M3 12h3l3 -8l4 16l3 -8h5"
          stroke={activeColor}
          strokeOpacity="0.25"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Travelling cardiac pulse */}
        <path
          d="M3 12h3l3 -8l4 16l3 -8h5"
          pathLength="100"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pb-anim-trace"
          style={{ filter: `drop-shadow(0 0 3px ${activeColor})` }}
        />
        {/* Pulsing heartbeat dot */}
        <circle
          cx="19"
          cy="12"
          r="2.5"
          fill={activeColor}
          className="pb-anim-dot"
          style={{ filter: `drop-shadow(0 0 4px ${activeColor})` }}
        />
      </svg>
    </span>
  );
}

/**
 * 2. PlayingOverlay
 * Standardized overlay applied to any playing music avatar (cards, table rows, search, etc.)
 * Provides a dark glass backdrop with the glowing animated heartbeat in the center.
 */
export function PlayingOverlay({
  color,
  size = 20,
  rounded = 'rounded-xl',
  className = '',
  indicatorClassName = '',
}) {
  const activeColor = color || PULSE_CONFIG.defaultAccent;

  return (
    <div
      className={`absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all pointer-events-none select-none ${rounded} ${className}`}
      aria-hidden="true"
    >
      <AnimationStyles />
      <div className="relative flex items-center justify-center">
        {/* Soft breathing halo behind the EKG */}
        <div
          className="absolute w-7 h-7 rounded-full pb-anim-halo pointer-events-none"
          style={{ backgroundColor: activeColor, opacity: 0.3 }}
        />
        <PlayingHeartbeat
          color={activeColor}
          size={size}
          className={indicatorClassName}
        />
      </div>
    </div>
  );
}

/**
 * 3. HeartbeatLoader
 * Custom heartbeat/EKG style loading animation designed to replace generic spinners.
 *
 * Variants:
 * - 'inline' (default): compact EKG waveform ideal for buttons, search inputs, pills.
 * - 'block': centered oscilloscope scope with traveling cardiac blip and optional text.
 * - 'fullscreen': full page/modal backdrop loader.
 */
export function HeartbeatLoader({
  color,
  size = 20,
  className = '',
  text = null,
  variant = 'inline',
}) {
  const activeColor = color || PULSE_CONFIG.defaultAccent;

  // Inline variant (replaces Loader2 size={16} inside buttons/inputs)
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <AnimationStyles />
        <svg
          width={size}
          height={Math.round(size * 0.75) || size}
          viewBox="0 0 28 20"
          fill="none"
          className="shrink-0 overflow-visible"
          role="status"
          aria-label="Loading"
        >
          {/* Faint baseline */}
          <path
            d="M2 10h4l2 -6l3 13l3 -10l2 5h10"
            stroke={activeColor}
            strokeOpacity="0.25"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Active sweeping cardiac pulse */}
          <path
            d="M2 10h4l2 -6l3 13l3 -10l2 5h10"
            pathLength="100"
            stroke={activeColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pb-loader-trace"
            style={{ filter: `drop-shadow(0 0 3px ${activeColor})` }}
          />
          {/* End pulse beacon */}
          <circle
            cx="24"
            cy="10"
            r="2"
            fill={activeColor}
            className="pb-loader-dot"
            style={{ filter: `drop-shadow(0 0 3px ${activeColor})` }}
          />
        </svg>
        {text && <span className="text-xs font-space font-medium">{text}</span>}
      </span>
    );
  }

  // Block or Fullscreen variant (for modal loading or section loading)
  const isFullscreen = variant === 'fullscreen';

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-bg/85 backdrop-blur-md' : 'w-full py-10'
      } ${className}`}
      role="status"
      aria-label="Loading"
    >
      <AnimationStyles />
      <div className="relative flex flex-col items-center justify-center">
        {/* Soft background ambient scope glow */}
        <div
          className="absolute -inset-4 rounded-3xl blur-xl opacity-20 pointer-events-none pb-scope-glow"
          style={{ backgroundColor: activeColor }}
        />

        {/* Oscilloscope Card */}
        <div className="relative px-6 py-4 rounded-2xl bg-sidebar/90 border border-brd shadow-xl flex flex-col items-center gap-3 backdrop-blur-sm">
          <svg
            width={Math.max(size * 2, 72)}
            height={Math.max(size, 32)}
            viewBox="0 0 72 28"
            fill="none"
            className="overflow-visible"
          >
            {/* Monitor baseline */}
            <path
              d="M2 14h18l3 -9l4 18l4 -14l3 7l2 -2h34"
              stroke={activeColor}
              strokeOpacity="0.2"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Cardiac pulse wave */}
            <path
              d="M2 14h18l3 -9l4 18l4 -14l3 7l2 -2h34"
              pathLength="100"
              stroke={activeColor}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pb-loader-trace"
              style={{ filter: `drop-shadow(0 0 6px ${activeColor})` }}
            />
            {/* Heartbeat dot */}
            <circle
              cx="68"
              cy="14"
              r="2.5"
              fill={activeColor}
              className="pb-loader-dot"
              style={{ filter: `drop-shadow(0 0 6px ${activeColor})` }}
            />
          </svg>

          {/* Loading status message */}
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full pb-loader-dot"
              style={{ backgroundColor: activeColor }}
            />
            <span className="text-xs font-space font-bold uppercase tracking-wider text-txt-sec">
              {text || 'Loading PulseBeat...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Backward Compatibility Re-export
 * Matches existing HeartbeatIndicator signature so existing code continues working.
 */
export const HeartbeatIndicator = PlayingHeartbeat;
export default PlayingHeartbeat;

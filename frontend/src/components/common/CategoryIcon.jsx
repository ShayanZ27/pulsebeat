import React from 'react';

/**
 * CategoryIcon renders a custom, clean SVG icon tailored for each Genre and Mood in PulseBeat.
 * Replaces generic emojis with polished vector artwork.
 */
export default function CategoryIcon({
  name = '',
  size = 24,
  className = '',
  color = 'currentColor',
}) {
  const key = name.toLowerCase().trim();

  switch (key) {
    /* ══════════════════════════════════════════════════════════════════
       GENRES
       ══════════════════════════════════════════════════════════════════ */

    // 1. Bollywood (Classical Sitar / Indian Instrument)
    case 'bollywood':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Main sound gourd */}
          <circle cx="8" cy="16" r="5" fill={color} fillOpacity="0.2" />
          {/* Upper resonator gourd */}
          <circle cx="16" cy="7" r="2.5" fill={color} fillOpacity="0.15" />
          {/* Neck / Fretboard */}
          <line x1="11" y1="13" x2="19" y2="5" strokeWidth="2.2" />
          {/* Frets on neck */}
          <line x1="12.5" y1="10.5" x2="14" y2="12" />
          <line x1="14.5" y1="8.5" x2="16" y2="10" />
          <line x1="16.5" y1="6.5" x2="18" y2="8" />
          {/* Tuning Pegs */}
          <path d="M19 4l2-2" />
          <path d="M20 6l2-1" />
          {/* Strings */}
          <line x1="6.5" y1="16" x2="18" y2="4.5" strokeDasharray="1 1" strokeWidth="1" />
        </svg>
      );

    // 2. Pop (Sparkle Vocal Mic)
    case 'pop':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Mic Capsule */}
          <rect x="7" y="3" width="7" height="11" rx="3.5" fill={color} fillOpacity="0.25" />
          {/* Mic Grille Lines */}
          <line x1="7" y1="7" x2="14" y2="7" />
          <line x1="7" y1="10" x2="14" y2="10" />
          {/* Stand cradle */}
          <path d="M4 10a6.5 6.5 0 0 0 13 0" />
          <line x1="10.5" y1="16.5" x2="10.5" y2="21" strokeWidth="2" />
          <line x1="7.5" y1="21" x2="13.5" y2="21" strokeWidth="2" />
          {/* Pop Star Sparkles */}
          <path d="M19 3v4m-2-2h4" strokeWidth="1.5" />
          <path d="M21 13v2m-1-1h2" strokeWidth="1.2" />
        </svg>
      );

    // 3. Rock (Electric Guitar)
    case 'rock':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Solid Body Double-cutaway */}
          <path
            d="M5.5 12.5C4 13.5 3 15.5 3.5 18c.5 2.5 2.5 3.5 5 3.5 3 0 4.5-2 5.5-4 .5-1 .5-2 0-3-.5-1-1.5-1.5-1.5-2.5 0-.8.5-1.5 1-2L11 8.5c-.8.3-1.8.8-2.5 1.5-.8.8-1 1.5-1.5 2-.5.5-1 .5-1.5.5z"
            fill={color}
            fillOpacity="0.25"
          />
          {/* Neck */}
          <line x1="12.5" y1="10" x2="20.5" y2="2" strokeWidth="2.2" />
          {/* Headstock with tuning pegs */}
          <path d="M19 3.5l2-1.5 1.5 1.5-1.5 2" fill={color} fillOpacity="0.4" />
          <circle cx="21" cy="2" r="0.75" fill={color} />
          <circle cx="22" cy="4" r="0.75" fill={color} />
          {/* Pickups */}
          <line x1="7.5" y1="15" x2="9.5" y2="13" strokeWidth="2" />
          <line x1="6" y1="16.5" x2="8" y2="14.5" strokeWidth="2" />
          {/* Volume Knob */}
          <circle cx="8" cy="18.5" r="1" fill={color} />
        </svg>
      );

    // 4. Hip-Hop (Vintage Boombox)
    case 'hip-hop':
    case 'hip hop':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Handle */}
          <path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
          {/* Boombox Body */}
          <rect x="2" y="6" width="20" height="15" rx="3" fill={color} fillOpacity="0.2" />
          {/* Left Speaker */}
          <circle cx="7" cy="14" r="3" fill={color} fillOpacity="0.3" />
          <circle cx="7" cy="14" r="1.2" fill={color} />
          {/* Right Speaker */}
          <circle cx="17" cy="14" r="3" fill={color} fillOpacity="0.3" />
          <circle cx="17" cy="14" r="1.2" fill={color} />
          {/* Cassette Deck / Controls */}
          <rect x="11" y="11" width="2" height="6" rx="0.5" />
          <line x1="5" y1="9" x2="9" y2="9" />
          <line x1="15" y1="9" x2="19" y2="9" />
        </svg>
      );

    // 5. Rap (Studio Condenser Mic & Beat Wave)
    case 'rap':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Dynamic Mic Capsule */}
          <rect x="9" y="2" width="6" height="10" rx="3" fill={color} fillOpacity="0.3" />
          <line x1="9" y1="5.5" x2="15" y2="5.5" />
          {/* U-Shaped Suspension Shockmount */}
          <path d="M6 8a6 6 0 0 0 12 0" />
          <line x1="12" y1="14" x2="12" y2="18" strokeWidth="2" />
          {/* Sharp Sound Wave / Lightning Accent */}
          <path d="M3 13l2.5-3 2 4 3-5" strokeWidth="1.6" />
          <path d="M14 9l2.5 4 2-3 2.5 2.5" strokeWidth="1.6" />
          {/* Base */}
          <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
        </svg>
      );

    // 6. EDM (DJ Turntable & Equalizer)
    case 'edm':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Outer Vinyl Platter */}
          <circle cx="11" cy="12" r="8" fill={color} fillOpacity="0.15" />
          {/* Inner Groove Rings */}
          <circle cx="11" cy="12" r="5" strokeDasharray="2 2" />
          {/* Center Record Label */}
          <circle cx="11" cy="12" r="2" fill={color} />
          {/* Tonearm */}
          <circle cx="20" cy="5" r="1.5" fill={color} />
          <path d="M20 6.5l-3 4-2.5-.5" strokeWidth="1.8" />
          {/* DJ Equalizer Faders on right */}
          <line x1="21" y1="14" x2="21" y2="20" />
          <line x1="20" y1="16" x2="22" y2="16" strokeWidth="2" />
        </svg>
      );

    // 7. Indie (Acoustic Guitar & Folk Leaves)
    case 'indie':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Acoustic Guitar Body (Figure-8) */}
          <path
            d="M6 13a4 4 0 0 1 4-4c1 0 1.5.5 2 1s1 1 2 1a4 4 0 1 1-8 2z"
            fill={color}
            fillOpacity="0.25"
          />
          {/* Round Sound Hole */}
          <circle cx="9" cy="14" r="1.5" fill={color} />
          {/* Neck */}
          <line x1="13.5" y1="10.5" x2="20.5" y2="3.5" strokeWidth="2.2" />
          {/* Headstock */}
          <line x1="19.5" y1="2.5" x2="22" y2="5" strokeWidth="2" />
          {/* Indie Acoustic Leaves */}
          <path d="M4 6c2-1 4 0 4 3-2 1-4 0-4-3z" fill={color} fillOpacity="0.4" />
          <path d="M3 9c1.5-.5 3 0 3 2-1.5.5-3 0-3-2z" fill={color} fillOpacity="0.4" />
        </svg>
      );

    // 8. Classical (Orchestral Violin)
    case 'classical':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Violin Body with Waist Bout */}
          <path
            d="M6 15c-1.5 1-2 3-1.5 4.5s2.5 2.5 4.5 2c2-.5 3-2 3.5-3.5 0-.8-.5-1.5-.8-2.2-.3-.8-.3-1.8.3-2.3.8-.7 1.8-.7 2.2-.3.5.5.8 1.5 1.8 1.5 1 0 2-.8 2.3-1.8.3-1.5-.5-3-1.8-3.5L12 8l-4 4-2 3z"
            fill={color}
            fillOpacity="0.25"
          />
          {/* F-Holes */}
          <path d="M7 16.5c.5-.5.8-1 .5-1.5" />
          <path d="M10 18c.5-.5.8-1 .5-1.5" />
          {/* Neck & Scroll */}
          <line x1="12" y1="8" x2="19" y2="1" strokeWidth="2.2" />
          <circle cx="20" cy="2" r="1.5" fill={color} />
          {/* Violin Bow crossing */}
          <line x1="3" y1="8" x2="16" y2="21" strokeWidth="1.2" strokeDasharray="3 1" />
        </svg>
      );

    // 9. Instrumental (Piano Keyboard & Melodic Waves)
    case 'instrumental':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Piano Keyboard Frame */}
          <rect x="2" y="7" width="20" height="13" rx="2" fill={color} fillOpacity="0.15" />
          {/* White Key Dividers */}
          <line x1="6" y1="7" x2="6" y2="20" />
          <line x1="10" y1="7" x2="10" y2="20" />
          <line x1="14" y1="7" x2="14" y2="20" />
          <line x1="18" y1="7" x2="18" y2="20" />
          {/* Black Keys */}
          <rect x="4.5" y="7" width="3" height="7" rx="0.5" fill={color} />
          <rect x="8.5" y="7" width="3" height="7" rx="0.5" fill={color} />
          <rect x="14.5" y="7" width="3" height="7" rx="0.5" fill={color} />
          <rect x="18.5" y="7" width="2" height="7" rx="0.5" fill={color} />
          {/* Flowing Note Wave on Top */}
          <path d="M4 4c2-1 4 1 6 0s4-2 6-1 3 1 4 0" strokeWidth="1.4" />
        </svg>
      );

    // 10. Jazz (Brass Saxophone)
    case 'jazz':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Saxophone Body Tube */}
          <path
            d="M7 3h2v10a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V9l2.5-1.5L20 6l-3 1.5V13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V3z"
            fill={color}
            fillOpacity="0.25"
          />
          {/* Flared Bell Mouth */}
          <ellipse cx="19" cy="8" rx="2.5" ry="1.5" fill={color} fillOpacity="0.4" />
          {/* Saxophone Keys */}
          <circle cx="8" cy="7" r="0.8" fill={color} />
          <circle cx="8" cy="9.5" r="0.8" fill={color} />
          <circle cx="8" cy="12" r="0.8" fill={color} />
          {/* Musical Jazz Accent Note */}
          <path d="M3 6a1.5 1.5 0 1 0 2-1.5V2l2.5-.5" strokeWidth="1.4" />
        </svg>
      );

    /* ══════════════════════════════════════════════════════════════════
       MOODS
       ══════════════════════════════════════════════════════════════════ */

    // 11. Happy (Radiant Smiling Sun)
    case 'happy':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Sun Center */}
          <circle cx="12" cy="12" r="5" fill={color} fillOpacity="0.25" />
          {/* Happy Eyes and Smile */}
          <circle cx="10" cy="11" r="0.8" fill={color} stroke="none" />
          <circle cx="14" cy="11" r="0.8" fill={color} stroke="none" />
          <path d="M10 14a2.5 2.5 0 0 0 4 0" strokeWidth="1.6" />
          {/* Solar Rays */}
          <line x1="12" y1="2" x2="12" y2="4.5" strokeWidth="2" />
          <line x1="12" y1="19.5" x2="12" y2="22" strokeWidth="2" />
          <line x1="2" y1="12" x2="4.5" y2="12" strokeWidth="2" />
          <line x1="19.5" y1="12" x2="22" y2="12" strokeWidth="2" />
          <line x1="4.9" y1="4.9" x2="6.7" y2="6.7" strokeWidth="1.8" />
          <line x1="17.3" y1="17.3" x2="19.1" y2="19.1" strokeWidth="1.8" />
          <line x1="4.9" y1="19.1" x2="6.7" y2="17.3" strokeWidth="1.8" />
          <line x1="17.3" y1="6.7" x2="19.1" y2="4.9" strokeWidth="1.8" />
        </svg>
      );

    // 12. Romantic (Intertwined Hearts & Heartbeat)
    case 'romantic':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Primary Heart */}
          <path
            d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566z"
            fill={color}
            fillOpacity="0.25"
          />
          {/* Mini companion heart */}
          <path
            d="M17.5 4a2.5 2.5 0 0 0-3.5 0l-.5.5-.5-.5a2.5 2.5 0 0 0-3.5 3.5l4 4 4-4a2.5 2.5 0 0 0 0-3.5z"
            fill={color}
            fillOpacity="0.4"
          />
          {/* Gleam Sparkle */}
          <path d="M12 9v3m-1.5-1.5h3" strokeWidth="1.5" />
        </svg>
      );

    // 13. Chill (Steaming Coffee & Calm Wave)
    case 'chill':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Coffee Mug */}
          <path d="M4 9h11v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" fill={color} fillOpacity="0.25" />
          {/* Mug Handle */}
          <path d="M15 10h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2" />
          {/* Steam Swirls */}
          <path d="M7 6c0-1.5 1-2 1-3" strokeWidth="1.6" />
          <path d="M10 6c0-1.5 1-2 1-3" strokeWidth="1.6" />
          <path d="M13 6c0-1.5 1-2 1-3" strokeWidth="1.6" />
          {/* Saucer / Wave Line */}
          <path d="M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0" strokeWidth="1.6" />
        </svg>
      );

    // 14. Party (Celebration Confetti Popper)
    case 'party':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Popper Cone */}
          <path d="M4 20l5-15 11 11-16 4z" fill={color} fillOpacity="0.25" />
          <line x1="8" y1="17" x2="16" y2="9" />
          {/* Confetti Bursts & Streamers */}
          <circle cx="17" cy="4" r="1" fill={color} />
          <circle cx="21" cy="8" r="1.2" fill={color} />
          <circle cx="13" cy="2" r="1" fill={color} />
          <path d="M14 6l3-3" strokeWidth="1.5" />
          <path d="M18 10l3-2" strokeWidth="1.5" />
          <path d="M19 14l2 1" strokeWidth="1.5" />
          <path d="M11 2l1 2" strokeWidth="1.5" />
        </svg>
      );

    // 15. Energetic (High-Voltage Lightning Spark)
    case 'energetic':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Primary High-Voltage Bolt */}
          <polygon
            points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
            fill={color}
            fillOpacity="0.3"
          />
          {/* Speed Glow Trails */}
          <line x1="5" y1="6" x2="8" y2="6" strokeWidth="1.4" />
          <line x1="3" y1="9" x2="6" y2="9" strokeWidth="1.4" />
          <line x1="16" y1="18" x2="19" y2="18" strokeWidth="1.4" />
        </svg>
      );

    // 16. Sad (Melancholy Raincloud)
    case 'sad':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Cloud Outline */}
          <path
            d="M17.5 14H6.5A4.5 4.5 0 0 1 6 5.03 6 6 0 0 1 17.15 7.6 4.5 4.5 0 0 1 17.5 14z"
            fill={color}
            fillOpacity="0.25"
          />
          {/* Falling Teardrops / Raindrops */}
          <line x1="8" y1="17" x2="7.5" y2="20" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="16.5" x2="11.5" y2="21" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="17" x2="15.5" y2="20" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // 17. Calm (Zen Lotus Blossom)
    case 'calm':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Center Lotus Petal */}
          <path
            d="M12 4c-1.5 3-2 6-2 9a4 4 0 0 0 4 0c0-3-.5-6-2-9z"
            fill={color}
            fillOpacity="0.4"
          />
          {/* Left Petal */}
          <path
            d="M10 13c-2-1-4-3-6-3 0 3.5 3 6 6 6"
            fill={color}
            fillOpacity="0.2"
          />
          {/* Right Petal */}
          <path
            d="M14 13c2-1 4-3 6-3 0 3.5-3 6-6 6"
            fill={color}
            fillOpacity="0.2"
          />
          {/* Water Ripple Base */}
          <path d="M4 19c2.5-1 5.5-1 8 0s5.5 1 8 0" strokeWidth="1.6" />
        </svg>
      );

    // 18. Focus (Target Crosshair & Deep Mind Waves)
    case 'focus':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Outer Target Ring */}
          <circle cx="12" cy="12" r="8" fill={color} fillOpacity="0.15" />
          {/* Inner Precision Ring */}
          <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
          {/* Center Target Dot */}
          <circle cx="12" cy="12" r="1.5" fill={color} />
          {/* Precision Crosshairs */}
          <line x1="12" y1="2" x2="12" y2="5" strokeWidth="2" />
          <line x1="12" y1="19" x2="12" y2="22" strokeWidth="2" />
          <line x1="2" y1="12" x2="5" y2="12" strokeWidth="2" />
          <line x1="19" y1="12" x2="22" y2="12" strokeWidth="2" />
        </svg>
      );

    // 19. Nostalgic (Retro Cassette Tape)
    case 'nostalgic':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Cassette Outer Shell */}
          <rect x="2" y="5" width="20" height="14" rx="2.5" fill={color} fillOpacity="0.25" />
          {/* Label Window */}
          <rect x="5" y="8" width="14" height="6.5" rx="1" strokeWidth="1.4" />
          {/* Left Spool */}
          <circle cx="8" cy="11.2" r="1.8" fill={color} fillOpacity="0.4" />
          <circle cx="8" cy="11.2" r="0.8" fill={color} />
          {/* Right Spool */}
          <circle cx="16" cy="11.2" r="1.8" fill={color} fillOpacity="0.4" />
          <circle cx="16" cy="11.2" r="0.8" fill={color} />
          {/* Tape Bridge Bottom */}
          <path d="M6 19l2-2.5h8l2 2.5" strokeWidth="1.4" />
        </svg>
      );

    // 20. Sleep (Crescent Dream Moon & Night Stars)
    case 'sleep':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Crescent Moon */}
          <path
            d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9 9 0 0 0 12 3z"
            fill={color}
            fillOpacity="0.3"
          />
          {/* Twinkling Dream Stars */}
          <path d="M19 4v3m-1.5-1.5h3" strokeWidth="1.5" />
          <path d="M15 2v2m-1-1h2" strokeWidth="1.2" />
          <circle cx="20" cy="10" r="0.8" fill={color} stroke="none" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.2" />
          <path d="M9 18V9l7-2v9" />
          <circle cx="7" cy="18" r="2" fill={color} />
          <circle cx="14" cy="16" r="2" fill={color} />
        </svg>
      );
  }
}

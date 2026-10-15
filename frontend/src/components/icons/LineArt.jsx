/* ─── Custom Premium SVGs (Line Art) ───
   Moved verbatim from the original prototype; paths must stay untouched to
   preserve the design. */

export const HeadphonesLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    {/* Headband - thick arc with highlight */}
    <path d="M40 110 C40 45, 160 45, 160 110" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M48 110 C48 55, 152 55, 152 110" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
    {/* Headband padding/cushion at top */}
    <path d="M88 52 C88 48, 112 48, 112 52" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M85 55 L85 50 C85 44, 115 44, 115 50 L115 55" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
    {/* Left ear cup - outer shell */}
    <path d="M40 100 L40 155 C40 165, 30 168, 28 155 L28 115 C28 100, 40 98, 40 100 Z" stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    {/* Left ear cup - inner detail / cushion */}
    <path d="M38 108 L38 148 C38 156, 32 158, 31 148 L31 118 C31 108, 38 106, 38 108 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
    {/* Left driver circle */}
    <circle cx="35" cy="128" r="6" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
    <circle cx="35" cy="128" r="2.5" fill={color} opacity="0.3" />
    {/* Left cup - inner mesh lines */}
    <path d="M32 115 L38 115 M32 121 L38 121 M32 135 L38 135 M32 141 L38 141" stroke={color} strokeWidth="0.8" opacity="0.25" />
    {/* Right ear cup - outer shell */}
    <path d="M160 100 L160 155 C160 165, 170 168, 172 155 L172 115 C172 100, 160 98, 160 100 Z" stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    {/* Right ear cup - inner detail / cushion */}
    <path d="M162 108 L162 148 C162 156, 168 158, 169 148 L169 118 C169 108, 162 106, 162 108 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
    {/* Right driver circle */}
    <circle cx="165" cy="128" r="6" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
    <circle cx="165" cy="128" r="2.5" fill={color} opacity="0.3" />
    {/* Right cup - inner mesh lines */}
    <path d="M162 115 L168 115 M162 121 L168 121 M162 135 L168 135 M162 141 L168 141" stroke={color} strokeWidth="0.8" opacity="0.25" />
    {/* Left hinge/slider */}
    <path d="M40 98 L40 105" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M36 100 L44 100" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    {/* Right hinge/slider */}
    <path d="M160 98 L160 105" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M156 100 L164 100" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    {/* Cable from left cup */}
    <path d="M34 165 C34 180, 40 190, 50 195" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    <circle cx="50" cy="195" r="2" fill={color} opacity="0.3" />
  </svg>
);

export const VinylDiscLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    {/* Outermost ring */}
    <circle cx="100" cy="100" r="96" stroke={color} strokeWidth="2" />
    <circle cx="100" cy="100" r="93" stroke={color} strokeWidth="0.5" opacity="0.3" />
    {/* Groove rings — many concentric circles for realism */}
    <circle cx="100" cy="100" r="88" stroke={color} strokeWidth="0.4" opacity="0.25" />
    <circle cx="100" cy="100" r="84" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <circle cx="100" cy="100" r="80" stroke={color} strokeWidth="0.4" opacity="0.2" />
    <circle cx="100" cy="100" r="76" stroke={color} strokeWidth="0.6" opacity="0.35" />
    <circle cx="100" cy="100" r="72" stroke={color} strokeWidth="0.4" opacity="0.2" />
    <circle cx="100" cy="100" r="68" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <circle cx="100" cy="100" r="64" stroke={color} strokeWidth="0.4" opacity="0.25" />
    <circle cx="100" cy="100" r="60" stroke={color} strokeWidth="0.6" opacity="0.35" />
    <circle cx="100" cy="100" r="56" stroke={color} strokeWidth="0.4" opacity="0.2" />
    <circle cx="100" cy="100" r="52" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <circle cx="100" cy="100" r="48" stroke={color} strokeWidth="0.4" opacity="0.25" />
    <circle cx="100" cy="100" r="44" stroke={color} strokeWidth="0.6" opacity="0.3" />
    <circle cx="100" cy="100" r="40" stroke={color} strokeWidth="0.4" opacity="0.2" />
    {/* Label area boundary */}
    <circle cx="100" cy="100" r="34" stroke={color} strokeWidth="1.5" opacity="0.6" />
    {/* Label inner details */}
    <circle cx="100" cy="100" r="28" stroke={color} strokeWidth="0.8" opacity="0.4" />
    <circle cx="100" cy="100" r="22" stroke={color} strokeWidth="0.5" opacity="0.3" />
    {/* Center spindle hole */}
    <circle cx="100" cy="100" r="8" stroke={color} strokeWidth="2" opacity="0.8" />
    <circle cx="100" cy="100" r="3" fill={color} opacity="0.6" />
    {/* Light reflection arc on the vinyl */}
    <path d="M55 55 C60 52, 65 50, 72 48" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3" fill="none" />
    <path d="M130 148 C135 150, 140 150, 148 148" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.25" fill="none" />
    {/* Tonearm hint (subtle diagonal line) */}
    <path d="M170 15 L130 60" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    <circle cx="170" cy="15" r="3" stroke={color} strokeWidth="1" opacity="0.2" fill="none" />
    <circle cx="130" cy="60" r="2" fill={color} opacity="0.15" />
  </svg>
);

export const MusicNoteLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 80 100" fill="none" className={className}>
    {/* Main note - stem */}
    <path d="M30 85 L30 20" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Flag / beam flowing from stem top */}
    <path d="M30 20 C30 20, 55 18, 55 32 C55 42, 38 40, 30 38" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M30 30 C30 30, 50 28, 50 40 C50 48, 38 47, 30 46" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
    {/* Note head - filled oval */}
    <ellipse cx="23" cy="87" rx="10" ry="7" transform="rotate(-20 23 87)" fill={color} opacity="0.8" />
    <ellipse cx="23" cy="87" rx="10" ry="7" transform="rotate(-20 23 87)" stroke={color} strokeWidth="1.5" fill="none" />
    {/* Inner highlight on note head */}
    <ellipse cx="21" cy="85" rx="4" ry="2.5" transform="rotate(-20 21 85)" fill={color} opacity="0.15" />
    {/* Small decorative dots around */}
    <circle cx="60" cy="15" r="2" fill={color} opacity="0.4" />
    <circle cx="10" cy="25" r="1.5" fill={color} opacity="0.3" />
    <circle cx="65" cy="50" r="1.5" fill={color} opacity="0.25" />
  </svg>
);

export const DoubleNoteLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    {/* Left note stem */}
    <path d="M25 80 L25 25" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Right note stem */}
    <path d="M65 85 L65 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Beam connecting the two notes */}
    <path d="M25 25 L65 30" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <path d="M25 33 L65 38" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    {/* Left note head */}
    <ellipse cx="18" cy="82" rx="10" ry="7" transform="rotate(-15 18 82)" fill={color} opacity="0.8" />
    <ellipse cx="18" cy="82" rx="10" ry="7" transform="rotate(-15 18 82)" stroke={color} strokeWidth="1.5" fill="none" />
    {/* Right note head */}
    <ellipse cx="72" cy="87" rx="10" ry="7" transform="rotate(-15 72 87)" fill={color} opacity="0.8" />
    <ellipse cx="72" cy="87" rx="10" ry="7" transform="rotate(-15 72 87)" stroke={color} strokeWidth="1.5" fill="none" />
    {/* Decorative dots */}
    <circle cx="45" cy="15" r="2" fill={color} opacity="0.3" />
    <circle cx="85" cy="45" r="1.5" fill={color} opacity="0.25" />
  </svg>
);

export const SquiggleLineSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 40 10" fill="none" className={className}>
    <path d="M2 5 Q 6 1, 10 5 T 18 5 T 26 5 T 34 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const MinimalWaveformSVG = ({ color, className = "" }) => (
  <svg viewBox="0 0 32 24" fill="none" className={className}>
    <rect x="2" y="10" width="3" height="4" rx="1.5" fill={color} />
    <rect x="7" y="6" width="3" height="12" rx="1.5" fill={color} />
    <rect x="12" y="2" width="3" height="20" rx="1.5" fill={color} />
    <rect x="17" y="5" width="3" height="14" rx="1.5" fill={color} />
    <rect x="22" y="8" width="3" height="8" rx="1.5" fill={color} />
    <rect x="27" y="10" width="3" height="4" rx="1.5" fill={color} />
  </svg>
);

export const LogoPulseSVG = ({ color, size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 12h3l3 -8l4 16l3 -8h5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="19" cy="12" r="2.5" fill={color} />
  </svg>
);

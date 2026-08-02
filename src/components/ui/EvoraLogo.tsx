/**
 * EvoraLogo — rounded-square leaf icon + "EVORA" wordmark.
 *
 * Reference analysis:
 * - Icon bg: soft salmon/blush square (lighter than primary coral)
 * - Leaf mark: dark brown/maroon — three petals, centre tallest
 * - Wordmark: "EVORA" in caps, same salmon tone on dark bg / plum on light bg
 */

interface EvoraLogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

// The leaf mark colour is a dark brown — shown on the salmon square in the reference
const LEAF_COLOR = '#3D1F1A';
// Icon background: soft salmon, consistent across themes (it's a brand element, not a UI surface)
const ICON_BG = '#F0A898';

export function EvoraLogo({ size = 36, className = '', iconOnly = false }: EvoraLogoProps) {
  const wordmarkFontSize = Math.round(size * 0.47);

  return (
    <span className={`flex items-center gap-2.5 select-none ${className}`} style={{ lineHeight: 1 }}>
      {/* ── Icon mark ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Rounded-square background — soft salmon, matches reference */}
        <rect width="40" height="40" rx="9" fill={ICON_BG} />

        {/* ── Three-leaf lotus mark — dark brown, matching the reference ── */}

        {/* Centre leaf — tallest, upright teardrop */}
        <path
          d="M20 29.5 C18 25 15.5 21 15.5 17 C15.5 13.5 17.5 11 20 11 C22.5 11 24.5 13.5 24.5 17 C24.5 21 22 25 20 29.5Z"
          fill={LEAF_COLOR}
        />

        {/* Left leaf — fans to the lower-left */}
        <path
          d="M14.5 26.5 C13 22.5 10 19.5 10.5 15.5 C11 12.5 13.5 11 16 12 C18.5 13 19 16 17.5 19 C16.5 21.5 15.5 24 14.5 26.5Z"
          fill={LEAF_COLOR}
          opacity="0.85"
        />

        {/* Right leaf — fans to the lower-right */}
        <path
          d="M25.5 26.5 C27 22.5 30 19.5 29.5 15.5 C29 12.5 26.5 11 24 12 C21.5 13 21 16 22.5 19 C23.5 21.5 24.5 24 25.5 26.5Z"
          fill={LEAF_COLOR}
          opacity="0.85"
        />
      </svg>

      {/* ── Wordmark ── */}
      {!iconOnly && (
        <span
          className="font-sans font-semibold tracking-widest text-plum dark:text-blush uppercase"
          style={{ fontSize: wordmarkFontSize, letterSpacing: '0.2em', lineHeight: 1 }}
        >
          EVORA
        </span>
      )}
    </span>
  );
}

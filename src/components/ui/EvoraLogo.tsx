/**
 * EvoraLogo — rounded-square leaf icon + "EVORA" wordmark.
 * Adapts automatically to the current theme via CSS variables.
 */

interface EvoraLogoProps {
  /** Size of the icon square in px */
  size?: number;
  /** Extra classes for the wrapper flex container */
  className?: string;
  /** Show only the icon mark (no wordmark) */
  iconOnly?: boolean;
}

export function EvoraLogo({ size = 36, className = '', iconOnly = false }: EvoraLogoProps) {
  const wordmarkSize = Math.round(size * 0.47);

  return (
    <span className={`flex items-center gap-2.5 select-none ${className}`}>
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
        {/* Rounded-square background */}
        <rect
          width="40"
          height="40"
          rx="10"
          className="fill-coral"
        />

        {/* Three-leaf / lotus mark — matches the reference */}
        {/* Centre leaf (tallest) */}
        <path
          d="M20 28 C20 28 14 22 14 16.5 C14 13.5 16.5 11 20 11 C23.5 11 26 13.5 26 16.5 C26 22 20 28 20 28Z"
          className="fill-cream"
          opacity="0.92"
        />
        {/* Left leaf */}
        <path
          d="M14 24 C14 24 8.5 19.5 9.5 14.5 C10 12 12.5 10.5 15.5 11.5 C18 12.3 19 15 18 18 C17 21 14 24 14 24Z"
          className="fill-cream"
          opacity="0.7"
        />
        {/* Right leaf */}
        <path
          d="M26 24 C26 24 31.5 19.5 30.5 14.5 C30 12 27.5 10.5 24.5 11.5 C22 12.3 21 15 22 18 C23 21 26 24 26 24Z"
          className="fill-cream"
          opacity="0.7"
        />
      </svg>

      {/* ── Wordmark ── */}
      {!iconOnly && (
        <span
          className="font-serif font-bold tracking-widest text-plum dark:text-plum uppercase"
          style={{ fontSize: wordmarkSize, letterSpacing: '0.18em', lineHeight: 1 }}
        >
          EVORA
        </span>
      )}
    </span>
  );
}

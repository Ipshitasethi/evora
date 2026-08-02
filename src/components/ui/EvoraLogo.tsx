/**
 * EvoraLogo — uses the exact image provided.
 */

interface EvoraLogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

export function EvoraLogo({ size = 36, className = '', iconOnly = false }: EvoraLogoProps) {
  const wordmarkFontSize = Math.round(size * 0.47);

  return (
    <span
      className={`flex items-center gap-2.5 select-none ${className}`}
      style={{ lineHeight: 1 }}
    >
      {/* ── Exact Image from Reference ── */}
      <img 
        src="/logo.png" 
        alt="Evora Logo" 
        width={size} 
        height={size} 
        className="rounded-[9px]"
        style={{ flexShrink: 0, objectFit: 'contain' }}
      />

      {/* ── Wordmark ── */}
      {!iconOnly && (
        <span
          className="font-serif font-semibold uppercase text-plum dark:text-blush"
          style={{ fontSize: wordmarkFontSize, letterSpacing: '0.2em', lineHeight: 1 }}
        >
          EVORA
        </span>
      )}
    </span>
  );
}

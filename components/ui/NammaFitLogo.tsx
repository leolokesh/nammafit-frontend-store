/**
 * NammaFit brand logo components.
 * The mark is an inline SVG tracing the gradient "nf" monogram.
 * The wordmark renders "namma" + "fit" in the brand's typography.
 */

interface MarkProps {
  /** pixel size — applied to both width and height */
  size?: number;
  className?: string;
}

/** The standalone logo image mark (no text) */
export function NammaFitMark({ size = 36, className = "" }: MarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jpg"
      alt="NammaFit"
      className={`object-cover rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Full horizontal lockup: mark + "namma" + "fit" */
export function NammaFitLockup({
  markSize = 28,
  className = "",
}: {
  markSize?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <NammaFitMark size={markSize} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: markSize * 0.75 }}
      >
        <span
          style={{
            backgroundImage: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          namma
        </span>
        <span
          style={{
            backgroundImage: "linear-gradient(90deg, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          fit
        </span>
      </span>
    </div>
  );
}

/**
 * Returns the SVG as a raw string for embedding into canvas/PDF.
 * Includes an explicit white background rect for PNG export.
 */
export function getNammaFitSVGString(bgColor = "#091413"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="${bgColor}" rx="20"/>
  <defs>
    <linearGradient id="g" x1="30" y1="185" x2="170" y2="15" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#4ecdc4"/>
      <stop offset="30%"  stop-color="#6366f1"/>
      <stop offset="65%"  stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <path d="M 42 165 L 42 52 C 42 36 52 24 66 22 C 72 21 77 23 81 27"
    stroke="url(#g)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 81 27 C 108 27 130 52 130 90 C 130 128 110 155 84 155
     C 70 155 60 146 60 134 C 60 122 70 114 82 114 C 94 114 102 123 102 134"
    stroke="url(#g)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

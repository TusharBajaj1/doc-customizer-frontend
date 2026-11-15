/** The PDFRookie mark: a document with a folded corner and three lines of text. Same shape as the favicon and the Android icon. */
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-md border-2 border-ink bg-brand-500 ${className}`} aria-hidden>
      <svg viewBox="28 22 52 64" className="h-[62%] w-[62%]" role="img" aria-label="">
        <path d="M36,30 L60,30 L72,42 L72,78 L36,78 Z" fill="#fff" />
        <path d="M60,30 L60,42 L72,42 Z" fill="#ffd9cc" />
        <path d="M42,52 H66 V56 H42 Z M42,60 H66 V64 H42 Z M42,68 H58 V72 H42 Z" fill="#e0431a" />
      </svg>
    </span>
  );
}

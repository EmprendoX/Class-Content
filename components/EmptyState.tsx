interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="relative mb-6">
        <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="board" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#4F46E5" />
              <stop offset="1" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="sheet" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#EEF0FF" />
            </linearGradient>
          </defs>
          {/* Chalkboard back */}
          <rect x="20" y="14" width="120" height="76" rx="8" fill="url(#board)" />
          <rect x="26" y="20" width="108" height="64" rx="4" fill="#312E81" opacity="0.6" />
          {/* Chalk lines */}
          <path d="M36 38 H100" stroke="#DCE0FF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <path d="M36 50 H86" stroke="#DCE0FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <path d="M36 62 H110" stroke="#DCE0FF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <path d="M36 74 H72" stroke="#DCE0FF" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
          {/* Easel legs */}
          <path d="M40 90 L26 110 M120 90 L134 110" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          {/* Floating sheet of paper */}
          <g transform="translate(96 60) rotate(8)">
            <rect width="48" height="58" rx="4" fill="url(#sheet)" stroke="#B8C0FF" strokeWidth="1" />
            <path d="M6 12 H42 M6 22 H38 M6 32 H42 M6 42 H30" stroke="#8B95FF" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          {/* Coral spark */}
          <g transform="translate(126 24)" className="animate-pulse-soft">
            <circle r="6" fill="#FFE0D6" opacity="0.6" />
            <circle r="3" fill="#FF6F3C" />
            <path d="M0 -6 V-9 M0 6 V9 M-6 0 H-9 M6 0 H9" stroke="#FF6F3C" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink-900 mb-1">{title}</h3>
      <p className="text-sm text-ink-500 max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}

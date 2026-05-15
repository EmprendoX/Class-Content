interface LogoProps {
  variant?: 'mark' | 'horizontal' | 'mono';
  size?: number;
  className?: string;
}

export default function Logo({ variant = 'horizontal', size = 36, className = '' }: LogoProps) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aulaGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={variant === 'mono' ? '#0F172A' : '#4F46E5'} />
          <stop offset="1" stopColor={variant === 'mono' ? '#0F172A' : '#312E81'} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#aulaGrad)" />
      {/* Stylized A: two strokes forming peak + crossbar */}
      <path
        d="M11 30 L20 11 L29 30"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M14.5 23 L25.5 23" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      {/* Coral spark (AI accent) */}
      {variant !== 'mono' && (
        <g transform="translate(28 8)">
          <circle r="3.4" fill="#FF6F3C" />
          <circle r="1.5" fill="#FFF1ED" />
        </g>
      )}
    </svg>
  );

  if (variant === 'mark') return <span className={className}>{mark}</span>;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark}
      <span
        className={`font-display font-extrabold tracking-tight ${
          variant === 'mono' ? 'text-ink-900' : 'text-ink-900'
        }`}
        style={{ fontSize: size * 0.7, letterSpacing: '-0.02em' }}
      >
        Aula
      </span>
    </span>
  );
}

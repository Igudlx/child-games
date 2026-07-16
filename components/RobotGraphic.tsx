export function RobotGraphic({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Antenna */}
      <line x1="100" y1="8" x2="100" y2="28" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="6" r="5" stroke="currentColor" strokeWidth="2" />

      {/* Head */}
      <rect x="60" y="28" width="80" height="64" rx="12" stroke="currentColor" strokeWidth="2" />
      <circle cx="82" cy="58" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="118" cy="58" r="7" stroke="currentColor" strokeWidth="2" />
      <line x1="80" y1="78" x2="120" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Neck */}
      <line x1="100" y1="92" x2="100" y2="104" stroke="currentColor" strokeWidth="2" />

      {/* Torso */}
      <rect x="48" y="104" width="104" height="88" rx="14" stroke="currentColor" strokeWidth="2" />
      <line x1="48" y1="132" x2="152" y2="132" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="100" cy="160" r="16" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="160" r="5" fill="currentColor" />

      {/* Arms */}
      <line x1="48" y1="120" x2="20" y2="150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="152" y1="120" x2="180" y2="150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="156" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="183" cy="156" r="6" stroke="currentColor" strokeWidth="2" />

      {/* Legs */}
      <line x1="80" y1="192" x2="76" y2="232" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="120" y1="192" x2="124" y2="232" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RobotGraphic({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* antenna */}
      <line x1="100" y1="10" x2="100" y2="30" stroke="white" strokeWidth="2" />
      <circle cx="100" cy="7" r="5" stroke="white" strokeWidth="2" />

      {/* head */}
      <rect x="55" y="30" width="90" height="70" rx="16" stroke="white" strokeWidth="2" />
      <circle cx="80" cy="63" r="7" stroke="white" strokeWidth="2" />
      <circle cx="120" cy="63" r="7" stroke="white" strokeWidth="2" />
      <path d="M78 82 Q100 92 122 82" stroke="white" strokeWidth="2" strokeLinecap="round" />

      {/* neck */}
      <line x1="90" y1="100" x2="90" y2="112" stroke="white" strokeWidth="2" />
      <line x1="110" y1="100" x2="110" y2="112" stroke="white" strokeWidth="2" />

      {/* torso */}
      <rect x="45" y="112" width="110" height="80" rx="14" stroke="white" strokeWidth="2" />
      <line x1="100" y1="112" x2="100" y2="192" stroke="white" strokeWidth="1" opacity="0.4" />
      <circle cx="100" cy="150" r="18" stroke="white" strokeWidth="2" />
      <circle cx="100" cy="150" r="6" stroke="white" strokeWidth="2" />

      {/* arms */}
      <line x1="45" y1="130" x2="18" y2="150" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="150" x2="18" y2="185" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="155" y1="130" x2="182" y2="150" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="182" y1="150" x2="182" y2="185" stroke="white" strokeWidth="2" strokeLinecap="round" />

      {/* legs */}
      <line x1="75" y1="192" x2="70" y2="230" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="125" y1="192" x2="130" y2="230" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

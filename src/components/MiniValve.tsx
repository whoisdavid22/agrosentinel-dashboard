interface MiniValveProps {
  pct: number;
}

export default function MiniValve({ pct }: MiniValveProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const ringColor = clamped === 0 ? '#b23a2c' : clamped < 60 ? '#b8791f' : '#268a4a';
  const handleAngle = -90 + (clamped / 100) * 90;

  return (
    <div
      className="relative w-24 h-24 rounded-full flex items-center justify-center transition-shadow duration-500"
      style={{ boxShadow: `0 0 24px ${ringColor}44` }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          style={{ stroke: ringColor, transition: 'stroke 0.5s' }}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * 264} 264`}
          transform="rotate(-90 50 50)"
        />
        <circle cx="50" cy="50" r="8" fill="#1a1a1c" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          style={{ stroke: ringColor, transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1), stroke 0.5s' }}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${handleAngle} 50 50)`}
        />
      </svg>
    </div>
  );
}

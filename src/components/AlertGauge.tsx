import type { NivelAlerta } from '../lib/types';

const ICONS: Record<NivelAlerta, string> = { NORMAL: '✓', LEVE: '▲', SEVERO: '⛔' };
const COLORS: Record<NivelAlerta, string> = { NORMAL: '#268a4a', LEVE: '#b8791f', SEVERO: '#b23a2c' };
const DIMS: Record<NivelAlerta, string> = { NORMAL: 'rgba(38,138,74,0.15)', LEVE: 'rgba(184,121,31,0.15)', SEVERO: 'rgba(178,58,44,0.15)' };

export default function AlertGauge({ level }: { level: NivelAlerta | null }) {
  const lvl = level ?? 'NORMAL';
  const segColors = [
    lvl === 'NORMAL' || lvl === 'LEVE' || lvl === 'SEVERO' ? COLORS[lvl === 'NORMAL' ? 'NORMAL' : lvl] : 'rgba(255,255,255,0.1)',
    lvl === 'LEVE' || lvl === 'SEVERO' ? COLORS[lvl] : 'rgba(255,255,255,0.1)',
    lvl === 'SEVERO' ? COLORS.SEVERO : 'rgba(255,255,255,0.1)',
  ];

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {segColors.map((c, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-colors duration-500" style={{ background: c }} />
        ))}
      </div>
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-500"
        style={{ background: DIMS[lvl], color: COLORS[lvl] }}
      >
        <span>{ICONS[lvl]}</span>
        <span>{lvl}</span>
      </div>
    </div>
  );
}

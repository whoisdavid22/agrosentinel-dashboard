import { useMemo, useState } from 'react';
import { REGION_RANGES } from '../../lib/constants';
import type { FieldZoneState, ImageZone } from '../../lib/types';

interface MapTabProps {
  hum: number;
  ndvi: number;
  usingImageZones: boolean;
  imageZones: ImageZone[] | null;
  resetMapToSimulation: () => void;
}

const ZONE_COLOR: Record<FieldZoneState, string> = { ok: '#268a4a', leve: '#b8791f', severo: '#b23a2c' };
const ZONE_LABEL: Record<FieldZoneState, string> = { ok: 'Normal', leve: 'Estrés leve', severo: 'Estrés severo' };

export default function MapTab({ hum, ndvi, usingImageZones, imageZones, resetMapToSimulation }: MapTabProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const zones = useMemo<FieldZoneState[]>(() => {
    const cells: FieldZoneState[] = new Array(64).fill('ok');

    if (usingImageZones && imageZones) {
      imageZones.forEach((z) => {
        const range = REGION_RANGES[(z.region || '').toLowerCase()];
        if (!range) return;
        const estado: FieldZoneState = z.estado === 'leve' || z.estado === 'severo' ? z.estado : 'ok';
        for (let row = range.rows[0]; row <= range.rows[1]; row++) {
          for (let col = range.cols[0]; col <= range.cols[1]; col++) {
            cells[row * 8 + col] = estado;
          }
        }
      });
      return cells;
    }

    for (let i = 0; i < 64; i++) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const localVariance = Math.sin(row * 1.3 + col * 0.7) * 12 + Math.cos(row * 0.5 + col * 1.1) * 8;
      const localHum = Math.max(0, Math.min(100, hum + localVariance));
      let zone: FieldZoneState = 'ok';
      if (localHum < 25 || ndvi < 0.3) zone = 'severo';
      else if (localHum < 40 || ndvi < 0.5) zone = 'leve';
      cells[i] = zone;
    }
    return cells;
  }, [hum, ndvi, usingImageZones, imageZones]);

  const counts = {
    ok: zones.filter((z) => z === 'ok').length,
    leve: zones.filter((z) => z === 'leve').length,
    severo: zones.filter((z) => z === 'severo').length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-white/40">
            {usingImageZones ? 'Mapa basado en el análisis real de la imagen subida.' : 'Simulación basada en el promedio del campo'}
          </div>
          {usingImageZones && (
            <button type="button" onClick={resetMapToSimulation} className="text-xs text-white/60 hover:text-white underline underline-offset-2">
              Volver a simulación
            </button>
          )}
        </div>

        <div className="relative grid grid-cols-8 gap-1 aspect-square max-w-md mx-auto">
          {zones.map((z, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="rounded-sm transition-colors cursor-pointer"
              style={{ background: ZONE_COLOR[z], opacity: hoverIdx === i ? 1 : 0.55 }}
            />
          ))}
          {hoverIdx !== null && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap pointer-events-none">
              Sector {Math.floor(hoverIdx / 8) + 1}-{(hoverIdx % 8) + 1} | {ZONE_LABEL[zones[hoverIdx]]}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-5 text-xs">
          <Legend color={ZONE_COLOR.ok} label={`Normal (${counts.ok})`} />
          <Legend color={ZONE_COLOR.leve} label={`Leve (${counts.leve})`} />
          <Legend color={ZONE_COLOR.severo} label={`Severo (${counts.severo})`} />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/60">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}

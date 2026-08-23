import { useEffect, useRef } from 'react';
import { buildValveScene, type ValveScene } from './valve3d/buildValveScene';

interface Valve3DTabProps {
  pct: number;
}

export default function Valve3DTab({ pct }: Valve3DTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ValveScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = buildValveScene(containerRef.current);
    sceneRef.current = scene;
    return () => scene.dispose();
  }, []);

  useEffect(() => {
    sceneRef.current?.setAperture(pct);
  }, [pct]);

  useEffect(() => {
    const onResize = () => sceneRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const stateLabel = pct === 0 ? 'CERRADA' : pct === 100 ? 'ABIERTA' : `ABIERTA ${Math.round(pct)}%`;
  const stateColor = pct === 0 ? '#b23a2c' : pct < 100 ? '#b8791f' : '#268a4a';
  const caudal = Math.round((pct / 100) * 4.2 * 10) / 10;

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} className="rounded-2xl overflow-hidden ring-1 ring-white/10 h-[320px] sm:h-[420px] bg-[#120d0a]" />
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5 flex items-center justify-between">
        <div>
          <div className="font-jetbrains text-lg font-medium" style={{ color: stateColor }}>
            {stateLabel}
          </div>
          <div className="text-xs text-white/40">Arrastra para rotar la cámara — se reanuda la rotación automática después de un momento.</div>
        </div>
        <div className="text-right">
          <div className="font-jetbrains text-lg text-white">{caudal} L/min</div>
          <div className="text-xs text-white/40">Caudal estimado</div>
        </div>
      </div>
    </div>
  );
}

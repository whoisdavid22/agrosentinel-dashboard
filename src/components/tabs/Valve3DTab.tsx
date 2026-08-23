import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { buildValveScene, type ValveScene } from './valve3d/buildValveScene';
import { makeT, type Lang } from '../../lib/translations';

interface Valve3DTabProps {
  lang: Lang;
  pct: number;
}

export default function Valve3DTab({ lang, pct }: Valve3DTabProps) {
  const tr = makeT(lang);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ValveScene | null>(null);
  const [flow, setFlow] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = buildValveScene(containerRef.current, { onFlowChange: setFlow });
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

  const stateLabel = pct === 0 ? tr('panel.valve.closed') : pct === 100 ? tr('panel.valve.open') : `${tr('panel.valve.open')} ${Math.round(pct)}%`;
  const stateColor = pct === 0 ? '#d94430' : pct < 100 ? '#b8791f' : '#3ba85c';

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} className="rounded-2xl overflow-hidden ring-1 ring-white/10 h-[320px] sm:h-[420px] bg-[#0b0e11]" />
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5 flex items-center justify-between">
        <div>
          <motion.div key={stateLabel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-jetbrains text-lg font-medium" style={{ color: stateColor }}>
            {stateLabel}
          </motion.div>
          <div className="text-xs text-white/40">{tr('valve3d.hint')}</div>
        </div>
        <div className="text-right">
          <div className="font-jetbrains text-lg text-white">{flow} L/min</div>
          <div className="text-xs text-white/40">{tr('valve3d.flow')}</div>
        </div>
      </div>
    </div>
  );
}

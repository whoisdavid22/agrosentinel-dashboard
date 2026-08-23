import { useEffect } from 'react';
import { motion } from 'framer-motion';
import ChartCanvas from '../ChartCanvas';
import { chartScalesDark, legendDark } from '../../lib/chartDefaults';
import { makeT, type Lang } from '../../lib/translations';
import type { HistorialRow } from '../../hooks/useDashboard';

interface HistorialTabProps {
  lang: Lang;
  historial: HistorialRow[] | null;
  historialStatus: string;
  cargarHistorialReal: () => void;
  loggedIn: boolean;
}

export default function HistorialTab({ lang, historial, historialStatus, cargarHistorialReal, loggedIn }: HistorialTabProps) {
  const tr = makeT(lang);

  useEffect(() => {
    if (loggedIn) cargarHistorialReal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const hasData = historial && historial.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-white">{tr('hist.title')}</h3>
          <button type="button" onClick={cargarHistorialReal} className="text-xs text-white/60 hover:text-white underline underline-offset-2">
            {tr('hist.refresh')}
          </button>
        </div>
        <p className="text-xs text-white/40">{historialStatus}</p>
      </div>

      {hasData && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
            <ChartCanvas
              config={{
                type: 'line',
                data: {
                  labels: historial!.map((r) => new Date(r.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit' })),
                  datasets: [
                    { label: tr('charts.humidityLabel'), data: historial!.map((r) => r.humedad_suelo_pct), borderColor: '#268a4a', backgroundColor: 'rgba(38,138,74,0.08)', tension: 0.3, pointRadius: 2, fill: true },
                    { label: tr('charts.ndviLabel'), data: historial!.map((r) => (r.ndvi || 0) * 100), borderColor: '#2d6e8f', backgroundColor: 'rgba(45,110,143,0.08)', tension: 0.3, pointRadius: 2, fill: true },
                  ],
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legendDark }, scales: { ...chartScalesDark, y: { ...chartScalesDark.y, min: 0, max: 100 } } },
              }}
            />
          </motion.div>

          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
            <h3 className="text-xs text-white/40 uppercase tracking-wide mb-3">{tr('hist.last15')}</h3>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {historial!
                .slice(-15)
                .reverse()
                .map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="grid grid-cols-[110px_80px_1fr] gap-2 text-xs py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="font-jetbrains text-white/40">{new Date(r.created_at).toLocaleString('es-CR')}</span>
                    <span className={`font-jetbrains font-medium ${r.valvula === 'ABIERTA' ? 'text-[#268a4a]' : 'text-[#b23a2c]'}`}>{r.valvula}</span>
                    <span className="text-white/60 truncate">{r.accion || ''}</span>
                  </motion.div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

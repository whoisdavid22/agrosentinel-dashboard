import { useState } from 'react';
import { motion } from 'framer-motion';
import { makeT, type Lang } from '../../lib/translations';
import type { AsignacionRed, RedComparativa } from '../../lib/types';

interface RedTabProps {
  lang: Lang;
  asignacionRed: AsignacionRed | null;
  comparativaRed: RedComparativa | null;
  cargarAsignacionRed: () => void;
  compartirConRed: (cuenca: string) => void;
  redCuenca: string;
  setRedCuenca: (v: string) => void;
  redShareStatus: string;
}

export default function RedTab({
  lang,
  asignacionRed,
  comparativaRed,
  cargarAsignacionRed,
  compartirConRed,
  redCuenca,
  setRedCuenca,
  redShareStatus,
}: RedTabProps) {
  const tr = makeT(lang);
  const [share, setShare] = useState(false);

  const comparaTexto = (() => {
    if (!comparativaRed || comparativaRed.apertura_propia == null || comparativaRed.apertura_promedio_vecinos == null) return null;
    const diff = Math.round(comparativaRed.apertura_propia - comparativaRed.apertura_promedio_vecinos);
    const n = comparativaRed.parcelas_vecinas;
    const avg = Math.round(comparativaRed.apertura_promedio_vecinos);
    if (diff >= 3) return tr('red.compare.more', diff, n, avg);
    if (diff <= -3) return tr('red.compare.less', -diff, n, avg);
    return tr('red.compare.same', n, avg);
  })();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <p className="text-sm text-white/50 mb-4">{tr('red.intro')}</p>

        <label className="flex items-center gap-2 text-sm text-white/70 mb-3 cursor-pointer">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="accent-[#7d2c44]" />
          {tr('red.share')}
        </label>

        {share && (
          <input
            type="text"
            value={redCuenca}
            onChange={(e) => setRedCuenca(e.target.value)}
            placeholder={tr('red.cuencaPlaceholder')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none mb-4"
          />
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => (share ? compartirConRed(redCuenca) : undefined)}
            className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            {tr('red.shareBtn')}
          </button>
          <button type="button" onClick={cargarAsignacionRed} className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors">
            {tr('red.refreshBtn')}
          </button>
        </div>

        {redShareStatus && <p className="text-xs text-white/40 mt-4">{redShareStatus}</p>}
      </div>

      {asignacionRed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">{tr('red.yourAssignment')}</h3>
            <button type="button" onClick={cargarAsignacionRed} className="text-xs text-white/60 hover:text-white underline underline-offset-2">
              {tr('red.refresh')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/40 mb-1">{tr('red.requested')}</div>
              <div className="text-xl text-white font-medium">{asignacionRed.porcentaje_apertura_deseado ?? '—'}%</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-white/40 mb-1">{tr('red.assigned')}</div>
              <div
                className="text-xl font-medium"
                style={{
                  color:
                    asignacionRed.porcentaje_apertura_asignado === null
                      ? 'rgba(255,255,255,0.4)'
                      : asignacionRed.porcentaje_apertura_asignado < (asignacionRed.porcentaje_apertura_deseado ?? 0)
                        ? '#b8791f'
                        : '#268a4a',
                }}
              >
                {asignacionRed.porcentaje_apertura_asignado ?? '—'}%
              </div>
            </div>
          </div>
          {asignacionRed.motivo_asignacion && <p className="text-xs text-white/50 leading-relaxed">{asignacionRed.motivo_asignacion}</p>}
        </motion.div>
      )}

      {comparaTexto && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-[#2d6e8f]/10 ring-1 ring-[#2d6e8f]/20 p-5">
          <h3 className="text-sm font-medium text-white mb-2">{tr('red.compare.title')}</h3>
          <p className="text-xs text-white/70 leading-relaxed">{comparaTexto}</p>
          {comparativaRed?.humedad_propia != null && comparativaRed?.humedad_promedio_vecinos != null && (
            <p className="text-xs text-white/45 leading-relaxed mt-2">
              {tr('red.compare.humidity', Math.round(comparativaRed.humedad_propia), Math.round(comparativaRed.humedad_promedio_vecinos))}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

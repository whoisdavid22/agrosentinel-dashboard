import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { makeT, type Lang } from '../../lib/translations';
import type { AsignacionRed, RedComparativa, NegociacionCuenca, ParcelaConfig } from '../../lib/types';

interface RedTabProps {
  lang: Lang;
  userId: string;
  asignacionRed: AsignacionRed | null;
  comparativaRed: RedComparativa | null;
  negociacion: NegociacionCuenca | null;
  cargarNegociacion: () => void;
  parcelaConfig: ParcelaConfig | null;
  guardarParcelaConfig: (cfg: ParcelaConfig) => void;
  actuadorStatus: string;
  cargarAsignacionRed: () => void;
  compartirConRed: (cuenca: string) => void;
  redCuenca: string;
  setRedCuenca: (v: string) => void;
  redShareStatus: string;
}

export default function RedTab({
  lang,
  userId,
  asignacionRed,
  comparativaRed,
  negociacion,
  cargarNegociacion,
  parcelaConfig,
  guardarParcelaConfig,
  actuadorStatus,
  cargarAsignacionRed,
  compartirConRed,
  redCuenca,
  setRedCuenca,
  redShareStatus,
}: RedTabProps) {
  const tr = makeT(lang);
  const [share, setShare] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const cfg: ParcelaConfig = parcelaConfig ?? { tiene_actuador: false, actuador_url: '', actuador_token: '' };
  const [actForm, setActForm] = useState<ParcelaConfig | null>(null);
  const act = actForm ?? cfg;

  const comparaTexto = (() => {
    if (!comparativaRed || comparativaRed.apertura_propia == null || comparativaRed.apertura_promedio_vecinos == null) return null;
    const diff = Math.round(comparativaRed.apertura_propia - comparativaRed.apertura_promedio_vecinos);
    const n = comparativaRed.parcelas_vecinas;
    const avg = Math.round(comparativaRed.apertura_promedio_vecinos);
    if (diff >= 3) return tr('red.compare.more', diff, n, avg);
    if (diff <= -3) return tr('red.compare.less', -diff, n, avg);
    return tr('red.compare.same', n, avg);
  })();

  const miResultado = negociacion?.resultado?.find((r) => r.user_id === userId) ?? null;

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

      {/* ── Negociación peer-to-peer de la cuenca ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">{tr('nego.title')}</h3>
          <button type="button" onClick={cargarNegociacion} className="text-xs text-white/60 hover:text-white underline underline-offset-2">
            {tr('red.refresh')}
          </button>
        </div>
        <p className="text-xs text-white/45 leading-relaxed mb-4">{tr('nego.intro')}</p>

        {!negociacion && <p className="text-xs text-white/40 leading-relaxed">{tr('nego.none')}</p>}

        {negociacion && (
          <>
            <div className="text-[11px] text-white/35 mb-3">
              {tr('nego.when', new Date(negociacion.ronda_at).toLocaleString(lang === 'es' ? 'es-CR' : 'en-US'))}
              {negociacion.capacidad_lmin != null && negociacion.demanda_total_lmin != null && (
                <> · {tr('nego.capacity', negociacion.capacidad_lmin, negociacion.demanda_total_lmin)}</>
              )}
            </div>

            {negociacion.acuerdo && (
              <div className="rounded-lg bg-[#8f5da6]/[0.08] ring-1 ring-[#8f5da6]/20 p-3 mb-4">
                <div className="text-[11px] uppercase tracking-wide text-[#c9a8dd] mb-1">{tr('nego.agreement')}</div>
                <p className="text-xs text-white/75 leading-relaxed">{negociacion.acuerdo}</p>
              </div>
            )}

            {negociacion.resultado && negociacion.resultado.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                <div className="text-[11px] uppercase tracking-wide text-white/40">{tr('nego.result')}</div>
                {negociacion.resultado.map((r, i) => {
                  const mine = r.user_id === userId;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${mine ? 'bg-[#268a4a]/10 ring-1 ring-[#268a4a]/25 text-white' : 'bg-white/[0.03] text-white/60'}`}
                    >
                      <span>{mine ? tr('nego.yours') : `${r.user_id.slice(0, 8)}…`}</span>
                      <span>
                        {tr('nego.requested')} {r.deseado_pct}% → <b style={{ color: r.asignado_pct < r.deseado_pct ? '#b8791f' : '#268a4a' }}>{tr('nego.assigned')} {r.asignado_pct}%</b>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {miResultado?.justificacion && <p className="text-xs text-white/50 leading-relaxed mb-3">{miResultado.justificacion}</p>}

            <div className="flex items-center justify-between text-xs text-white/55 border-t border-white/5 pt-3" title={tr('nego.creditHint')}>
              <span>{tr('nego.credit')}</span>
              <b style={{ color: negociacion.mi_credito > 0 ? '#268a4a' : negociacion.mi_credito < 0 ? '#b8791f' : 'rgba(255,255,255,0.5)' }}>
                {negociacion.mi_credito > 0 ? '+' : ''}{negociacion.mi_credito}
              </b>
            </div>

            {negociacion.transcripcion && negociacion.transcripcion.length > 0 && (
              <div className="mt-3">
                <button type="button" onClick={() => setTranscriptOpen((v) => !v)} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
                  <motion.span animate={{ rotate: transcriptOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown size={14} />
                  </motion.span>
                  {tr('nego.transcript')}
                </button>
                <AnimatePresence initial={false}>
                  {transcriptOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="mt-3 flex flex-col gap-2">
                        {negociacion.transcripcion.map((turno, i) => (
                          <div key={i} className="rounded-lg bg-white/[0.03] p-3">
                            <div className="text-[11px] text-white/40 mb-1">
                              {turno.agente === 'mediador' ? tr('nego.mediator') : `${String(turno.agente).slice(0, 8)}…`} · {tr('nego.round', turno.ronda)}
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed">{turno.mensaje}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ── Actuador físico (opcional) ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-2">{tr('actuador.title')}</h3>
        <p className="text-xs text-white/45 leading-relaxed mb-4">{tr('actuador.intro')}</p>

        <label className="flex items-center gap-2 text-sm text-white/70 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={act.tiene_actuador}
            onChange={(e) => setActForm({ ...act, tiene_actuador: e.target.checked })}
            className="accent-[#268a4a]"
          />
          {tr('actuador.toggle')}
        </label>

        {act.tiene_actuador && (
          <div className="flex flex-col gap-2 mb-3">
            <input
              type="url"
              value={act.actuador_url}
              onChange={(e) => setActForm({ ...act, actuador_url: e.target.value })}
              placeholder={tr('actuador.url')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
            />
            <input
              type="text"
              value={act.actuador_token}
              onChange={(e) => setActForm({ ...act, actuador_token: e.target.value })}
              placeholder={tr('actuador.token')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => guardarParcelaConfig(act)}
          className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
        >
          {tr('actuador.save')}
        </button>

        <p className="text-xs text-white/40 mt-4">{actuadorStatus || (act.tiene_actuador ? '' : tr('actuador.manual'))}</p>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Sparkles, Share2, CloudRain, AlertTriangle, Wrench } from 'lucide-react';
import { PHOTOS_POR_ALERTA, MODEL_NAME } from '../../lib/constants';
import { makeT, humanize, type Lang } from '../../lib/translations';
import type { DecisionResponse, Calibracion, AsignacionRed } from '../../lib/types';
import type { OfflineCalcResult } from '../../lib/faoCalc';
import type { LogEntry } from '../../lib/types';

interface DecisionTabProps {
  lang: Lang;
  lastResponse: DecisionResponse | null;
  offline: { active: boolean; etiqueta: string; calc: OfflineCalcResult } | null;
  logEntries: LogEntry[];
  calibracion: Calibracion | null;
  asignacionRed: AsignacionRed | null;
}

const CONF_COLORS: Record<string, { bg: string; fg: string }> = {
  ALTA: { bg: 'rgba(38,138,74,0.15)', fg: '#268a4a' },
  MEDIA: { bg: 'rgba(184,121,31,0.15)', fg: '#b8791f' },
  BAJA: { bg: 'rgba(178,58,44,0.15)', fg: '#b23a2c' },
};

export default function DecisionTab({ lang, lastResponse, offline, logEntries, calibracion, asignacionRed }: DecisionTabProps) {
  const tr = makeT(lang);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const level = offline ? offline.calc.nivel : lastResponse?.nivel_alerta;
  const photo = level ? PHOTOS_POR_ALERTA[lang][level] : PHOTOS_POR_ALERTA[lang].NORMAL;

  const valvulaLabel = offline
    ? offline.calc.aperturaPct > 0
      ? tr('panel.valve.open')
      : tr('panel.valve.closed')
    : lastResponse?.valvula;
  const accion = offline ? tr('decision.offline.action', valvulaLabel ?? '', offline.calc.aperturaPct) : lastResponse?.accion;

  const razonamiento = lastResponse?.razonamiento ?? [];
  const altos = razonamiento.filter((r) => r.peso === 'ALTO');
  const limitante = altos[0];

  return (
    <div className="flex flex-col gap-5">
      <motion.div
        key={photo.url}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl overflow-hidden ring-1 ring-white/10 relative h-40 sm:h-52"
      >
        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-3 left-4 text-xs font-medium text-white bg-black/40 backdrop-blur px-3 py-1 rounded-full">{photo.label}</span>
      </motion.div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5 sm:p-6">
        {!lastResponse && !offline && <p className="text-white/40 text-sm">{tr('decision.empty')}</p>}

        {(lastResponse || offline) && (
            <motion.div
              key={accion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 className="text-white font-medium text-lg">{accion}</h2>
                {lastResponse?.confianza && (
                  <span
                    title={lastResponse.confianza_motivo}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: CONF_COLORS[lastResponse.confianza]?.bg, color: CONF_COLORS[lastResponse.confianza]?.fg }}
                  >
                    {tr('decision.confidence')}: {lastResponse.confianza}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/30 font-jetbrains mb-2">
                {tr('decision.model')}: {MODEL_NAME}
                {lastResponse?.herramientas_consultadas && lastResponse.herramientas_consultadas.length > 0 && !offline && (
                  <span className="inline-flex items-center gap-1 ml-2 text-[#9a8cd8]">
                    <Wrench size={10} />
                    {tr('decision.toolsUsed')}: {lastResponse.herramientas_consultadas.map((h) => tr(`decision.tool.${h}` as never)).join(', ')}
                  </span>
                )}
              </p>

              {lastResponse?.anomalia_sensor?.detectada && !offline && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 rounded-lg bg-[#b8791f]/10 ring-1 ring-[#b8791f]/25 p-3 flex gap-2.5"
                >
                  <AlertTriangle size={16} className="shrink-0 text-[#b8791f] mt-0.5" />
                  <p className="text-xs text-white/70 leading-relaxed">
                    <b className="text-[#b8791f]">{tr('decision.anomaly.title')}</b>
                    {' — '}
                    {lastResponse.anomalia_sensor.tipo}
                    <br />
                    {lastResponse.anomalia_sensor.motivo}
                  </p>
                </motion.div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {calibracion && !offline && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    title={tr(`decision.calibration.${calibracion.confianza}`)}
                    className="inline-flex items-center gap-1.5 text-[11px] text-[#c9a8dd] bg-[#8f5da6]/10 px-2.5 py-1 rounded-full"
                  >
                    <Sparkles size={11} />
                    {tr('decision.calibration.badge', calibracion.kc_ajuste.toFixed(2), calibracion.muestras)}
                  </motion.div>
                )}
                {asignacionRed &&
                  asignacionRed.porcentaje_apertura_asignado !== null &&
                  asignacionRed.porcentaje_apertura_asignado !== asignacionRed.porcentaje_apertura_deseado && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                      title={asignacionRed.motivo_asignacion ?? undefined}
                      className="inline-flex items-center gap-1.5 text-[11px] text-[#2d6e8f] bg-[#2d6e8f]/10 px-2.5 py-1 rounded-full"
                    >
                      <Share2 size={11} />
                      {tr('red.requested')} {asignacionRed.porcentaje_apertura_deseado}% · {tr('red.assigned')} {asignacionRed.porcentaje_apertura_asignado}%
                    </motion.div>
                  )}
                {lastResponse?.ventana_riego && lastResponse.ventana_riego.recomendacion !== 'sin_pronostico' && !offline && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    title={lastResponse.ventana_riego.motivo}
                    className="inline-flex items-center gap-1.5 text-[11px] text-[#5aa8c9] bg-[#5aa8c9]/10 px-2.5 py-1 rounded-full"
                  >
                    <CloudRain size={11} />
                    {lastResponse.ventana_riego.recomendacion === 'esperar_lluvia'
                      ? tr('forecast.wait', lastResponse.ventana_riego.horas_hasta_lluvia ?? 0)
                      : tr('forecast.now')}
                  </motion.div>
                )}
              </div>

              <blockquote className={`text-sm leading-relaxed border-l-2 pl-4 ${offline ? 'italic text-[#b8791f] border-[#b8791f]/40' : 'text-white/70 border-white/10'}`}>
                {offline ? tr('decision.offline.body', offline.etiqueta, offline.calc.diasCriticos) : lastResponse?.justificacion}
              </blockquote>

              {(offline || (lastResponse && typeof lastResponse.et0_mm === 'number')) && (
                <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/5 font-jetbrains text-center">
                  <FaoStat label="ET0" value={(offline ? offline.calc.et0 : lastResponse!.et0_mm!).toFixed(2)} unit={lang === 'es' ? 'mm/día' : 'mm/day'} />
                  <FaoStat label="ETc" value={(offline ? offline.calc.etc : lastResponse!.etc_mm!).toFixed(2)} unit={lang === 'es' ? 'mm/día' : 'mm/day'} />
                  <FaoStat label="TAW" value={(offline ? offline.calc.taw : lastResponse!.taw_total_mm!).toFixed(1)} unit="mm" />
                </div>
              )}

              {!offline && razonamiento.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setReasoningOpen((v) => !v)} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
                    <motion.span animate={{ rotate: reasoningOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                      <ChevronDown size={14} />
                    </motion.span>
                    {tr('decision.showReasoning')}
                  </button>
                  <AnimatePresence initial={false}>
                    {reasoningOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex flex-col gap-2.5">
                          {razonamiento.map((r, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.25, delay: i * 0.05 }}
                              className="rounded-lg bg-white/[0.03] p-3"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-white">{humanize(r.factor)}</span>
                                <span
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{
                                    background: r.peso === 'ALTO' ? 'rgba(178,58,44,0.15)' : r.peso === 'MEDIO' ? 'rgba(184,121,31,0.15)' : 'rgba(255,255,255,0.06)',
                                    color: r.peso === 'ALTO' ? '#b23a2c' : r.peso === 'MEDIO' ? '#b8791f' : 'rgba(255,255,255,0.5)',
                                  }}
                                >
                                  {r.peso}
                                </span>
                              </div>
                              <p className="text-xs text-white/50 leading-relaxed">{r.analisis}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {limitante && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-4 rounded-lg bg-[#b23a2c]/10 ring-1 ring-[#b23a2c]/20 p-3 flex gap-2.5"
                >
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#b23a2c] text-white text-xs font-bold flex items-center justify-center">!</span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    {tr('decision.limitingFactor')}: <b className="text-white">{humanize(limitante.factor)}</b>
                    <br />
                    {limitante.analisis}
                  </p>
                </motion.div>
              )}
            </motion.div>
        )}
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">{tr('decision.log.title')}</h3>
          <span className="text-[11px] text-white/40 font-jetbrains">
            {logEntries.length} {logEntries.length !== 1 ? tr('decision.log.count_plural') : tr('decision.log.count')}
          </span>
        </div>
        {logEntries.length === 0 ? (
          <p className="text-white/30 text-xs">{tr('decision.log.empty')}</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            <AnimatePresence initial={false}>
              {logEntries.map((e, i) => (
                <motion.div
                  key={`${e.time}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 text-xs py-2 border-b border-white/5 last:border-0"
                >
                  <span className="font-jetbrains text-white/40 w-16 shrink-0">{e.time}</span>
                  <span className={`font-jetbrains font-medium w-24 shrink-0 ${e.valvula === 'ABIERTA' ? 'text-[#268a4a]' : 'text-[#b23a2c]'}`}>{e.valvula}</span>
                  <span className="flex items-center gap-1.5 text-white/60 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.nivel_alerta === 'NORMAL' ? '#268a4a' : e.nivel_alerta === 'LEVE' ? '#b8791f' : '#b23a2c' }} />
                    {e.accion}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function FaoStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-white text-base">{value}</div>
      <div className="text-[9px] text-white/30 uppercase tracking-wider">
        {label} <span className="normal-case">{unit}</span>
      </div>
    </div>
  );
}

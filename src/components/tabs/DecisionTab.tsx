import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PHOTOS_POR_ALERTA, MODEL_NAME } from '../../lib/constants';
import type { DecisionResponse } from '../../lib/types';
import type { OfflineCalcResult } from '../../lib/faoCalc';
import type { LogEntry } from '../../lib/types';

interface DecisionTabProps {
  lastResponse: DecisionResponse | null;
  offline: { active: boolean; etiqueta: string; calc: OfflineCalcResult } | null;
  logEntries: LogEntry[];
}

const CONF_COLORS: Record<string, { bg: string; fg: string }> = {
  ALTA: { bg: 'rgba(38,138,74,0.15)', fg: '#268a4a' },
  MEDIA: { bg: 'rgba(184,121,31,0.15)', fg: '#b8791f' },
  BAJA: { bg: 'rgba(178,58,44,0.15)', fg: '#b23a2c' },
};

export default function DecisionTab({ lastResponse, offline, logEntries }: DecisionTabProps) {
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const level = offline ? offline.calc.nivel : lastResponse?.nivel_alerta;
  const photo = level ? PHOTOS_POR_ALERTA[level] : PHOTOS_POR_ALERTA.NORMAL;

  const accion = offline
    ? `[MODO OFFLINE] ${offline.calc.aperturaPct > 0 ? 'ABIERTA' : 'CERRADA'} ${offline.calc.aperturaPct > 0 ? offline.calc.aperturaPct + '%' : ''}`
    : lastResponse?.accion;

  const razonamiento = lastResponse?.razonamiento ?? [];
  const altos = razonamiento.filter((r) => r.peso === 'ALTO');
  const limitante = altos[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 relative h-40 sm:h-52">
        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-3 left-4 text-xs font-medium text-white bg-black/40 backdrop-blur px-3 py-1 rounded-full">
          {photo.label}
        </span>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5 sm:p-6">
        {!lastResponse && !offline && (
          <p className="text-white/40 text-sm">Ajusta los datos en el panel izquierdo y presiona "Analizar con Claude AI" para obtener una decisión.</p>
        )}

        {(lastResponse || offline) && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h2 className="text-white font-medium text-lg">{accion}</h2>
              {lastResponse?.confianza && (
                <span
                  title={lastResponse.confianza_motivo}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: CONF_COLORS[lastResponse.confianza]?.bg, color: CONF_COLORS[lastResponse.confianza]?.fg }}
                >
                  Confianza: {lastResponse.confianza}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/30 font-jetbrains mb-4">Modelo: {MODEL_NAME}</p>

            <blockquote
              className={`text-sm leading-relaxed border-l-2 pl-4 ${offline ? 'italic text-[#b8791f] border-[#b8791f]/40' : 'text-white/70 border-white/10'}`}
            >
              {offline
                ? `Sin conexión con Claude/n8n (${offline.etiqueta}). Esta es una recomendación básica calculada localmente con la fórmula FAO-56 (sin el razonamiento de IA). Días estimados hasta estrés crítico: ${offline.calc.diasCriticos}. Reintenta cuando se restablezca la conexión para obtener el análisis completo.`
                : lastResponse?.justificacion}
            </blockquote>

            {(offline || (lastResponse && typeof lastResponse.et0_mm === 'number')) && (
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/5 font-jetbrains text-center">
                <FaoStat label="ET0" value={(offline ? offline.calc.et0 : lastResponse!.et0_mm!).toFixed(2)} unit="mm/día" />
                <FaoStat label="ETc" value={(offline ? offline.calc.etc : lastResponse!.etc_mm!).toFixed(2)} unit="mm/día" />
                <FaoStat label="TAW" value={(offline ? offline.calc.taw : lastResponse!.taw_total_mm!).toFixed(1)} unit="mm" />
              </div>
            )}

            {!offline && razonamiento.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setReasoningOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
                >
                  <ChevronDown size={14} className={`transition-transform ${reasoningOpen ? 'rotate-180' : ''}`} />
                  Ver razonamiento completo
                </button>
                {reasoningOpen && (
                  <div className="mt-3 flex flex-col gap-2.5">
                    {razonamiento.map((r, i) => (
                      <div key={i} className="rounded-lg bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">{r.factor}</span>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {limitante && (
              <div className="mt-4 rounded-lg bg-[#b23a2c]/10 ring-1 ring-[#b23a2c]/20 p-3 flex gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#b23a2c] text-white text-xs font-bold flex items-center justify-center">!</span>
                <p className="text-xs text-white/70 leading-relaxed">
                  Factor limitante identificado: <b className="text-white">{limitante.factor}</b>
                  <br />
                  {limitante.analisis}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Registro de decisiones</h3>
          <span className="text-[11px] text-white/40 font-jetbrains">
            {logEntries.length} registro{logEntries.length !== 1 ? 's' : ''}
          </span>
        </div>
        {logEntries.length === 0 ? (
          <p className="text-white/30 text-xs">Aún no hay análisis en esta sesión.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {logEntries.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-2 border-b border-white/5 last:border-0">
                <span className="font-jetbrains text-white/40 w-16 shrink-0">{e.time}</span>
                <span className={`font-jetbrains font-medium w-24 shrink-0 ${e.valvula === 'ABIERTA' ? 'text-[#268a4a]' : 'text-[#b23a2c]'}`}>{e.valvula}</span>
                <span className="flex items-center gap-1.5 text-white/60 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.nivel_alerta === 'NORMAL' ? '#268a4a' : e.nivel_alerta === 'LEVE' ? '#b8791f' : '#b23a2c' }} />
                  {e.accion}
                </span>
              </div>
            ))}
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

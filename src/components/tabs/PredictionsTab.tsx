import { motion } from 'framer-motion';
import type { Predictions } from '../../lib/faoCalc';
import type { NivelAlerta } from '../../lib/types';
import { makeT, type Lang } from '../../lib/translations';

interface PredictionsTabProps {
  lang: Lang;
  predictions: Predictions | null;
  level: NivelAlerta | null;
  hum: number;
  temp: number;
  ndvi: number;
}

export default function PredictionsTab({ lang, predictions, level, hum, temp, ndvi }: PredictionsTabProps) {
  const tr = makeT(lang);

  if (!predictions) {
    return (
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-8 text-center">
        <p className="text-white/40 text-sm">{tr('pred.empty')}</p>
      </div>
    );
  }

  const diasColor = predictions.diasCriticos <= 1 ? '#b23a2c' : predictions.diasCriticos <= 5 ? '#b8791f' : '#268a4a';
  const humNum = parseFloat(predictions.humIn24);
  const humColor = humNum < 30 ? '#b23a2c' : humNum < 50 ? '#b8791f' : '#2d6e8f';

  const EVENT_LABEL_KEY = { leve: 'pred.event.leve', critico: 'pred.event.critico', criticoActivo: 'pred.event.criticoActivo', review: 'pred.event.review' } as const;
  const EVENT_DESC_KEY = { leve: 'pred.event.leveDesc', critico: 'pred.event.criticoDesc', criticoActivo: 'pred.event.criticoActivoDesc', review: 'pred.event.reviewDesc' } as const;
  const eventTime = (when: number | 'now' | '24h') => {
    if (when === 'now') return tr('pred.event.now');
    if (when === '24h') return tr('pred.event.in24h');
    return tr('pred.event.in', when);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
          <div className="text-2xl font-medium" style={{ color: diasColor }}>
            {predictions.diasCriticos}d
          </div>
          <div className="text-xs text-white/40 mt-1">{predictions.diasCriticosCritical ? tr('pred.criticalNow') : tr('pred.estimatedAI')}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
          <div className="text-2xl font-medium" style={{ color: humColor }}>
            {predictions.humIn24}%
          </div>
          <div className="text-xs text-white/40 mt-1">{humNum < 30 ? tr('pred.criticalProjected') : tr('pred.withinRange')}</div>
        </motion.div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-4">{tr('pred.forecastTitle')}</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {predictions.forecast.map((f, i) => (
            <div key={f.hour} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${f.pct}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
                  className="w-full rounded-t"
                  style={{ background: f.color, opacity: 0.75 }}
                />
              </div>
              <span className="text-[10px] text-white/50 font-jetbrains">{f.pct.toFixed(0)}%</span>
              <span className="text-[10px] text-white/30">+{f.hour}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-4">{tr('pred.timelineTitle')}</h3>
        <div className="flex flex-col gap-4">
          {predictions.events.map((ev, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.08 }} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ev.color }} />
                {i < predictions.events.length - 1 && <span className="w-px flex-1 bg-white/10 mt-1" />}
              </div>
              <div className="pb-2">
                <div className="text-xs text-white/40 font-jetbrains">{eventTime(ev.when)}</div>
                <div className="text-sm text-white font-medium">{tr(EVENT_LABEL_KEY[ev.kind])}</div>
                <div className="text-xs text-white/50">{tr(EVENT_DESC_KEY[ev.kind])}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-3">{tr('pred.windowTitle')}</h3>
        {level === 'NORMAL' && (
          <p className="text-sm leading-relaxed">
            <span className="text-[#268a4a] font-medium">{tr('pred.normal.title')}</span>
            <br />
            <span className="text-white/50">{tr('pred.normal.body', hum)}</span>
          </p>
        )}
        {level === 'LEVE' && (
          <p className="text-sm leading-relaxed">
            <span className="text-[#b8791f] font-medium">{tr('pred.leve.title')}</span>
            <br />
            <span className="text-white/50">{tr('pred.leve.body', temp)}</span>
          </p>
        )}
        {level === 'SEVERO' && (
          <p className="text-sm leading-relaxed">
            <span className="text-[#b23a2c] font-medium">{tr('pred.severo.title')}</span>
            <br />
            <span className="text-white/50">{tr('pred.severo.body', hum, ndvi.toFixed(2))}</span>
          </p>
        )}
      </div>
    </div>
  );
}

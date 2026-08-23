import { motion } from 'framer-motion';
import { litrosAColones } from '../../lib/constants';
import { makeT, type Lang } from '../../lib/translations';
import type { DecisionResponse } from '../../lib/types';

interface CompareTabProps {
  lang: Lang;
  lastResponse: DecisionResponse | null;
  aguaAhorradaAcumulada: number;
  analisisAcumulados: number;
}

const ODS = [
  { n: '2', titleEs: 'Hambre Cero', titleEn: 'Zero Hunger', color: '#d3a029', descEs: 'Previene pérdida de cosecha por estrés hídrico no detectado a tiempo.', descEn: 'Prevents crop loss from water stress that goes undetected in time.' },
  { n: '6', titleEs: 'Agua Limpia y Saneamiento', titleEn: 'Clean Water and Sanitation', color: '#26bde2', descEs: 'Riega solo cuando los datos lo justifican, no por cronograma fijo.', descEn: 'Irrigates only when the data justifies it, not on a fixed schedule.' },
  { n: '13', titleEs: 'Acción por el Clima', titleEn: 'Climate Action', color: '#3f7e44', descEs: 'Ayuda a adaptar cultivos a condiciones climáticas variables.', descEn: 'Helps crops adapt to variable climate conditions.' },
];

export default function CompareTab({ lang, lastResponse, aguaAhorradaAcumulada, analisisAcumulados }: CompareTabProps) {
  const tr = makeT(lang);
  const litros = lastResponse?.litros_ahorrados_estimados ?? 0;
  const diasNo = lastResponse?.dias_sin_intervencion;
  const colones = litrosAColones(litros);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-white/5">
          <div className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-white/40 mb-2">{tr('compare.withoutAgent')}</div>
            <div className="text-lg text-white font-medium">{diasNo === 0 ? tr('compare.critical') : diasNo !== undefined ? `${diasNo} ${lang === 'es' ? 'días' : 'days'}` : '—'}</div>
            <div className="text-xs text-white/40 mt-1">{tr('compare.untilIntervene')}</div>
          </div>
          <div className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-white/40 mb-2">{tr('compare.withAgent')}</div>
            <motion.div key={litros} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-lg text-[#268a4a] font-medium">
              {litros > 0 ? `−${litros} L/m²` : tr('compare.irrigationActivated')}
            </motion.div>
            <div className="text-xs text-white/40 mt-1">{tr('compare.estimatedSaving')}</div>
          </div>
        </div>
      </div>

      {lastResponse && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-[#268a4a]/10 ring-1 ring-[#268a4a]/20 p-5">
          <div className="text-sm text-white/70">{tr('compare.savedThisAnalysis')}</div>
          <div className="text-2xl font-medium text-[#268a4a] mt-1">{litros} litros/m²</div>
          {litros > 0 && (
            <div className="text-xs text-white/40 mt-1">
              (≈ ₡{colones.toFixed(2)} {tr('compare.perM2')})
            </div>
          )}
        </motion.div>
      )}

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <div className="text-sm text-white/70">{tr('compare.savedSession')}</div>
        <div className="text-2xl font-medium text-white mt-1">{Math.round(aguaAhorradaAcumulada)} litros/m²</div>
        <div className="text-xs text-white/40 mt-1">
          {analisisAcumulados > 0 && `(≈ ₡${litrosAColones(aguaAhorradaAcumulada).toFixed(2)} ${tr('compare.perM2')} — ${analisisAcumulados} ${tr('compare.analyses')})`}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {ODS.map((o, i) => (
          <motion.div
            key={o.n}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-3" style={{ background: o.color }}>
              {o.n}
            </div>
            <div className="text-sm font-medium text-white mb-1">{lang === 'es' ? o.titleEs : o.titleEn}</div>
            <div className="text-xs text-white/50 leading-relaxed">{lang === 'es' ? o.descEs : o.descEn}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <div className="text-sm font-medium text-white mb-1">{tr('compare.autonomy.title')}</div>
        <p className="text-xs text-white/50 leading-relaxed">{tr('compare.autonomy.body')}</p>
      </div>
    </div>
  );
}

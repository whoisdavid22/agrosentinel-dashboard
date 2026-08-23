import { litrosAColones } from '../../lib/constants';
import type { DecisionResponse } from '../../lib/types';

interface CompareTabProps {
  lastResponse: DecisionResponse | null;
  aguaAhorradaAcumulada: number;
  analisisAcumulados: number;
}

const ODS = [
  { n: '2', title: 'Hambre Cero', color: '#d3a029', desc: 'Previene pérdida de cosecha por estrés hídrico no detectado a tiempo.' },
  { n: '6', title: 'Agua Limpia y Saneamiento', color: '#26bde2', desc: 'Riega solo cuando los datos lo justifican, no por cronograma fijo.' },
  { n: '13', title: 'Acción por el Clima', color: '#3f7e44', desc: 'Ayuda a adaptar cultivos a condiciones climáticas variables.' },
];

export default function CompareTab({ lastResponse, aguaAhorradaAcumulada, analisisAcumulados }: CompareTabProps) {
  const litros = lastResponse?.litros_ahorrados_estimados ?? 0;
  const diasNo = lastResponse?.dias_sin_intervencion;
  const colones = litrosAColones(litros);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-white/5">
          <div className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-white/40 mb-2">Sin agente (riego fijo)</div>
            <div className="text-lg text-white font-medium">{diasNo === 0 ? 'Crítico ahora' : diasNo !== undefined ? `${diasNo} días` : '—'}</div>
            <div className="text-xs text-white/40 mt-1">hasta intervenir</div>
          </div>
          <div className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-white/40 mb-2">Con AgroSentinel</div>
            <div className="text-lg text-[#268a4a] font-medium">{litros > 0 ? `−${litros} L/m²` : 'Riego activado'}</div>
            <div className="text-xs text-white/40 mt-1">ahorro estimado</div>
          </div>
        </div>
      </div>

      {lastResponse && (
        <div className="rounded-2xl bg-[#268a4a]/10 ring-1 ring-[#268a4a]/20 p-5">
          <div className="text-sm text-white/70">Agua ahorrada en este análisis</div>
          <div className="text-2xl font-medium text-[#268a4a] mt-1">{litros} litros/m²</div>
          {litros > 0 && <div className="text-xs text-white/40 mt-1">(≈ ₡{colones.toFixed(2)} por m² de parcela)</div>}
        </div>
      )}

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <div className="text-sm text-white/70">Ahorro acumulado en esta sesión</div>
        <div className="text-2xl font-medium text-white mt-1">{Math.round(aguaAhorradaAcumulada)} litros/m²</div>
        <div className="text-xs text-white/40 mt-1">
          {analisisAcumulados > 0 && `(≈ ₡${litrosAColones(aguaAhorradaAcumulada).toFixed(2)} por m² — ${analisisAcumulados} análisis)`}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {ODS.map((o) => (
          <div key={o.n} className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-3" style={{ background: o.color }}>
              {o.n}
            </div>
            <div className="text-sm font-medium text-white mb-1">{o.title}</div>
            <div className="text-xs text-white/50 leading-relaxed">{o.desc}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <div className="text-sm font-medium text-white mb-1">Autonomía real</div>
        <p className="text-xs text-white/50 leading-relaxed">
          Cada decisión se calcula primero con la metodología FAO-56 (evapotranspiración Hargreaves-Samani, balance hídrico
          del suelo, coeficientes de cultivo citables), y luego Claude razona sobre esos datos ya validados — nunca al
          revés. El ciclo percibir → decidir → actuar ocurre sin intervención humana.
        </p>
      </div>
    </div>
  );
}

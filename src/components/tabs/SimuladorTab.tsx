import { useMemo, useState } from 'react';
import ChartCanvas from '../ChartCanvas';
import { chartScalesDark, legendDark } from '../../lib/chartDefaults';
import type { CurrentData } from '../../lib/types';

interface SimuladorTabProps {
  currentData: CurrentData;
}

export default function SimuladorTab({ currentData }: SimuladorTabProps) {
  const [days, setDays] = useState(10);
  const [rainFactor, setRainFactor] = useState(1);
  const [freq, setFreq] = useState(3);
  const [irrigAmt, setIrrigAmt] = useState(15);
  const [run, setRun] = useState(false);

  const sim = useMemo(() => {
    if (!run) return null;
    const temp = currentData.temperatura_c;
    const etRate = (temp > 35 ? 3.5 : temp > 28 ? 2.5 : temp > 22 ? 1.8 : 1.2) + (currentData.dias_sin_lluvia > 10 ? 0.5 : 0);
    const dailyRainGain = rainFactor * 3;

    const labels: string[] = [];
    const sinRiego: number[] = [];
    const conRiego: number[] = [];
    let humSin = currentData.humedad_suelo_pct;
    let humCon = currentData.humedad_suelo_pct;
    let diaCriticoSin: number | null = null;
    let diaCriticoCon: number | null = null;

    for (let d = 0; d <= days; d++) {
      labels.push('D' + d);
      sinRiego.push(Math.round(humSin * 10) / 10);
      conRiego.push(Math.round(humCon * 10) / 10);
      if (humSin < 25 && diaCriticoSin === null) diaCriticoSin = d;
      if (humCon < 25 && diaCriticoCon === null) diaCriticoCon = d;

      humSin = Math.min(100, Math.max(0, humSin - etRate + dailyRainGain));
      humCon = Math.min(100, Math.max(0, humCon - etRate + dailyRainGain));
      if (d > 0 && d % freq === 0) humCon = Math.min(100, humCon + irrigAmt);
    }

    return { labels, sinRiego, conRiego, diaCriticoSin, diaCriticoCon };
  }, [run, days, rainFactor, freq, irrigAmt, currentData]);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <p className="text-xs text-white/50 mb-4">
          Proyección local (sin llamar a Claude) de cómo evolucionaría la humedad del suelo con distintas políticas de
          riego, partiendo de los valores actuales del panel izquierdo.
        </p>

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
          <SimField label="Días a proyectar" value={`${days}`} min={1} max={30} step={1} onChange={setDays} raw={days} />
          <div>
            <label className="text-[11px] uppercase tracking-wide text-white/50 block mb-1.5">Lluvia esperada</label>
            <select
              value={rainFactor}
              onChange={(e) => setRainFactor(parseFloat(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              <option value={0} className="bg-[#141416]">Ninguna (sequía)</option>
              <option value={0.3} className="bg-[#141416]">Baja / ocasional</option>
              <option value={1} className="bg-[#141416]">Normal para la zona</option>
            </select>
          </div>
          <SimField label="Riego cada" value={`${freq} días`} min={1} max={15} step={1} onChange={setFreq} raw={freq} />
          <SimField label="Riego aplicado" value={`${irrigAmt}%`} min={5} max={50} step={1} onChange={setIrrigAmt} raw={irrigAmt} />
        </div>

        <button
          type="button"
          onClick={() => setRun(true)}
          className="mt-5 bg-[#7d2c44] hover:bg-[#5e2033] text-white text-sm font-medium py-2.5 px-6 rounded-full transition-colors"
        >
          Simular
        </button>
      </div>

      {sim && (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
          <ChartCanvas
            config={{
              type: 'line',
              data: {
                labels: sim.labels,
                datasets: [
                  { label: 'Sin riego', data: sim.sinRiego, borderColor: '#b23a2c', backgroundColor: 'rgba(178,58,44,0.06)', tension: 0.35, pointRadius: 0, fill: true },
                  { label: 'Con política de riego', data: sim.conRiego, borderColor: '#268a4a', backgroundColor: 'rgba(38,138,74,0.08)', tension: 0.35, pointRadius: 0, fill: true },
                ],
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legendDark }, scales: { ...chartScalesDark, y: { ...chartScalesDark.y, min: 0, max: 100 } } },
            }}
          />
          <p className="text-sm mt-4 leading-relaxed">
            <b className="text-[#b23a2c]">Sin riego:</b>{' '}
            <span className="text-white/60">
              estrés crítico proyectado en {sim.diaCriticoSin !== null ? `día ${sim.diaCriticoSin}` : `no se alcanza en ${days} días`}.
            </span>
            <br />
            <b className="text-[#268a4a]">Con riego cada {freq} días (+{irrigAmt}%):</b>{' '}
            <span className="text-white/60">
              estrés crítico proyectado en {sim.diaCriticoCon !== null ? `día ${sim.diaCriticoCon}` : `no se alcanza en ${days} días`}.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function SimField({
  label,
  value,
  min,
  max,
  step,
  raw,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  raw: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wide text-white/50">{label}</span>
        <span className="font-jetbrains text-[11px] text-white">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={raw} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  );
}

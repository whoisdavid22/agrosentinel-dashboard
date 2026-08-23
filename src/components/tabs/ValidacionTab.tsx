import { useState } from 'react';
import ChartCanvas from '../ChartCanvas';
import { chartScalesDark } from '../../lib/chartDefaults';

interface NasaPowerResponse {
  properties: {
    parameter: {
      T2M: Record<string, number>;
      PRECTOTCORR: Record<string, number>;
      ALLSKY_SFC_SW_DWN: Record<string, number>;
    };
  };
}

export default function ValidacionTab() {
  const [lat, setLat] = useState('9.93');
  const [lon, setLon] = useState('-84.08');
  const [dias, setDias] = useState(90);
  const [status, setStatus] = useState('');
  const [resumen, setResumen] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; serie: number[] } | null>(null);

  async function runValidacionHistorica() {
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (isNaN(latN) || isNaN(lonN)) {
      setStatus('Ingresa latitud y longitud válidas.');
      return;
    }
    setStatus('Consultando NASA POWER (datos climáticos históricos reales)...');
    setResumen(null);
    setChartData(null);

    const hoy = new Date();
    const fin = new Date(hoy);
    fin.setDate(fin.getDate() - 1);
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - dias);
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lonN}&latitude=${latN}&start=${fmt(inicio)}&end=${fmt(fin)}&format=JSON`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('NASA POWER respondió con error HTTP ' + res.status);
      const data: NasaPowerResponse = await res.json();
      const params = data.properties.parameter;
      const fechas = Object.keys(params.T2M).filter((k) => params.T2M[k] > -900);
      if (fechas.length === 0) throw new Error('No se recibieron datos válidos para esas coordenadas.');

      const KC = 0.75;
      const TAW_total = 210 * 0.4;
      let humedad = 70;
      const labels: string[] = [];
      const serieHumedad: number[] = [];
      let totalRiegos = 0;

      fechas.forEach((fecha) => {
        const tmean = params.T2M[fecha];
        const precip = params.PRECTOTCORR[fecha] > -900 ? params.PRECTOTCORR[fecha] : 0;
        const rad = params.ALLSKY_SFC_SW_DWN[fecha] > -900 ? params.ALLSKY_SFC_SW_DWN[fecha] : 15;
        const Ra_mm = ((rad * 0.0864) / 2.45) * 10;
        const ET0 = Math.max(0, 0.0023 * (tmean + 17.8) * Math.sqrt(10) * Math.max(Ra_mm, 3));
        const ETc = ET0 * KC;

        let aguaMM = TAW_total * (humedad / 100);
        aguaMM = aguaMM - ETc + precip * 0.8;
        aguaMM = Math.max(0, Math.min(TAW_total, aguaMM));
        humedad = (aguaMM / TAW_total) * 100;

        const necesitaRiego = humedad < 50;
        if (necesitaRiego) {
          totalRiegos++;
          humedad = Math.min(100, humedad + 25);
        }

        labels.push(fecha.slice(4, 6) + '/' + fecha.slice(6, 8));
        serieHumedad.push(Math.round(humedad * 10) / 10);
      });

      setChartData({ labels, serie: serieHumedad });
      setStatus(`Simulación de ${fechas.length} días completada con datos climáticos reales de NASA POWER (lat ${latN}, lon ${lonN}).`);
      setResumen(
        `Con este clima real, el sistema hubiera activado el riego en ${totalRiegos} de ${fechas.length} días (${Math.round(
          (totalRiegos / fechas.length) * 100,
        )}%). Esto es una simulación determinística (fórmula FAO-56, sin IA) usada para validar que la lógica de decisión responde de forma sensata ante condiciones climáticas reales, no solo ante escenarios manuales.`,
      );
    } catch (err) {
      setStatus('Error al ejecutar la validación: ' + (err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <p className="text-xs text-white/50 mb-4">
          Simulación determinística (sin IA) día por día con clima histórico real de NASA POWER, para validar que la
          lógica FAO-56 responde de forma sensata ante condiciones reales.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-white/50 block mb-1.5">Latitud</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-white/50 block mb-1.5">Longitud</label>
            <input value={lon} onChange={(e) => setLon(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-white/50 block mb-1.5">Días</label>
            <select value={dias} onChange={(e) => setDias(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
              {[30, 60, 90].map((d) => (
                <option key={d} value={d} className="bg-[#141416]">
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={runValidacionHistorica} className="bg-[#7d2c44] hover:bg-[#5e2033] text-white text-sm font-medium py-2.5 px-6 rounded-full transition-colors">
          Ejecutar validación
        </button>
        {status && <p className="text-xs text-white/40 mt-4">{status}</p>}
      </div>

      {chartData && (
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
          <ChartCanvas
            config={{
              type: 'line',
              data: {
                labels: chartData.labels,
                datasets: [{ label: 'Humedad simulada %', data: chartData.serie, borderColor: '#268a4a', backgroundColor: 'rgba(38,138,74,0.08)', tension: 0.25, pointRadius: 0, fill: true }],
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ...chartScalesDark.x, ticks: { ...chartScalesDark.x.ticks, maxTicksLimit: 12 } }, y: { ...chartScalesDark.y, min: 0, max: 100 } } },
            }}
          />
          {resumen && <p className="text-sm text-white/60 leading-relaxed mt-4">{resumen}</p>}
        </div>
      )}
    </div>
  );
}

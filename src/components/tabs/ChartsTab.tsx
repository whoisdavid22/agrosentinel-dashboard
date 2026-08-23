import ChartCanvas from '../ChartCanvas';
import { chartScalesDark, legendDark } from '../../lib/chartDefaults';

interface ChartsTabProps {
  chartHistory: { labels: string[]; hum: number[]; ndvi: number[]; temp: number[]; prec: number[] };
}

export default function ChartsTab({ chartHistory }: ChartsTabProps) {
  if (chartHistory.labels.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-8 text-center">
        <p className="text-white/40 text-sm">Aún no hay datos. Realiza un análisis en la pestaña "Decisión" para empezar a graficar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ChartCard title="Humedad y NDVI (sesión actual)">
        <ChartCanvas
          config={{
            type: 'line',
            data: {
              labels: chartHistory.labels,
              datasets: [
                { label: 'Humedad %', data: chartHistory.hum, borderColor: '#268a4a', backgroundColor: 'rgba(38,138,74,0.08)', tension: 0.4, pointRadius: 3, pointBackgroundColor: '#268a4a', fill: true },
                { label: 'NDVI×100', data: chartHistory.ndvi, borderColor: '#2d6e8f', backgroundColor: 'rgba(45,110,143,0.08)', tension: 0.4, pointRadius: 3, pointBackgroundColor: '#2d6e8f', fill: true },
              ],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legendDark }, scales: { ...chartScalesDark, y: { ...chartScalesDark.y, min: 0, max: 100 } } },
          }}
        />
      </ChartCard>

      <div className="grid sm:grid-cols-2 gap-5">
        <ChartCard title="Temperatura (°C)">
          <ChartCanvas
            config={{
              type: 'bar',
              data: { labels: chartHistory.labels, datasets: [{ data: chartHistory.temp, backgroundColor: 'rgba(184,121,31,0.35)', borderColor: '#b8791f', borderWidth: 1, borderRadius: 3 }] },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { ...chartScalesDark, y: { ...chartScalesDark.y, min: 0, max: 50 } } },
            }}
          />
        </ChartCard>
        <ChartCard title="Precipitación (mm)">
          <ChartCanvas
            config={{
              type: 'bar',
              data: { labels: chartHistory.labels, datasets: [{ data: chartHistory.prec, backgroundColor: 'rgba(45,110,143,0.35)', borderColor: '#2d6e8f', borderWidth: 1, borderRadius: 3 }] },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { ...chartScalesDark, y: { ...chartScalesDark.y, min: 0 } } },
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
      <h3 className="text-sm font-medium text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

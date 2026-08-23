import type { Predictions } from '../../lib/faoCalc';
import type { NivelAlerta } from '../../lib/types';

interface PredictionsTabProps {
  predictions: Predictions | null;
  level: NivelAlerta | null;
  hum: number;
  temp: number;
  ndvi: number;
}

export default function PredictionsTab({ predictions, level, hum, temp, ndvi }: PredictionsTabProps) {
  if (!predictions) {
    return (
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-8 text-center">
        <p className="text-white/40 text-sm">Realiza un análisis primero para ver predicciones.</p>
      </div>
    );
  }

  const diasColor = predictions.diasCriticos <= 1 ? '#b23a2c' : predictions.diasCriticos <= 5 ? '#b8791f' : '#268a4a';
  const humNum = parseFloat(predictions.humIn24);
  const humColor = humNum < 30 ? '#b23a2c' : humNum < 50 ? '#b8791f' : '#2d6e8f';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
          <div className="text-2xl font-medium" style={{ color: diasColor }}>
            {predictions.diasCriticos}d
          </div>
          <div className="text-xs text-white/40 mt-1">{predictions.diasCriticosCritical ? 'Ya en estrés crítico' : 'Sin intervención, estimado IA'}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
          <div className="text-2xl font-medium" style={{ color: humColor }}>
            {predictions.humIn24}%
          </div>
          <div className="text-xs text-white/40 mt-1">{humNum < 30 ? 'Nivel crítico proyectado' : 'Dentro del rango'}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Proyección de humedad (próximas 8 horas)</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {predictions.forecast.map((f) => (
            <div key={f.hour} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <div className="w-full rounded-t transition-all duration-500" style={{ height: `${f.pct}%`, background: f.color, opacity: 0.75 }} />
              </div>
              <span className="text-[10px] text-white/50 font-jetbrains">{f.pct.toFixed(0)}%</span>
              <span className="text-[10px] text-white/30">+{f.hour}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Línea de tiempo de riesgo</h3>
        <div className="flex flex-col gap-4">
          {predictions.events.map((ev, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ev.color }} />
                {i < predictions.events.length - 1 && <span className="w-px flex-1 bg-white/10 mt-1" />}
              </div>
              <div className="pb-2">
                <div className="text-xs text-white/40 font-jetbrains">{ev.time}</div>
                <div className="text-sm text-white font-medium">{ev.label}</div>
                <div className="text-xs text-white/50">{ev.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <h3 className="text-sm font-medium text-white mb-3">Ventana de riego recomendada</h3>
        {level === 'NORMAL' && (
          <p className="text-sm leading-relaxed">
            <span className="text-[#268a4a] font-medium">Sin necesidad de riego en este momento.</span>
            <br />
            <span className="text-white/50">
              Humedad actual en {hum}% — dentro del rango óptimo. Próxima ventana sugerida: cuando la humedad caiga por debajo del 45%.
            </span>
          </p>
        )}
        {level === 'LEVE' && (
          <p className="text-sm leading-relaxed">
            <span className="text-[#b8791f] font-medium">Riego recomendado en las próximas horas.</span>
            <br />
            <span className="text-white/50">
              Ventana óptima: horas de la madrugada, menor evapotranspiración. Temperatura actual de {temp}°C — regar en horas de menor calor reduce pérdida por evaporación.
            </span>
          </p>
        )}
        {level === 'SEVERO' && (
          <p className="text-sm leading-relaxed">
            <span className="text-[#b23a2c] font-medium">Riego de emergencia requerido de inmediato.</span>
            <br />
            <span className="text-white/50">
              Humedad en {hum}% — por debajo del punto de marchitez permanente para la mayoría de cultivos. NDVI {ndvi.toFixed(2)} indica posible daño foliar — evaluar cultivo en campo.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

import { KC_TABLE_GENERICO, KC_POR_CULTIVO, TAW_TABLE, ROOT_TABLE } from './constants';
import type { CurrentData } from './types';

export interface OfflineCalcResult {
  et0: number;
  etc: number;
  taw: number;
  diasCriticos: number;
  nivel: 'NORMAL' | 'LEVE' | 'SEVERO';
  aperturaPct: number;
}

// Mirrors calcularFAO56Local() from the original dashboard exactly — same
// conservative constants (no lat/lon/NASA data available offline).
export function calcularFAO56Local(d: CurrentData): OfflineCalcResult {
  const rangoTermico = 10;
  const Ra_mm_aprox = 15;
  const ET0 = 0.0023 * (d.temperatura_c + 17.8) * Math.sqrt(rangoTermico) * Ra_mm_aprox;
  const tablaKc = KC_POR_CULTIVO[d.cultivo] || KC_TABLE_GENERICO;
  const Kc = tablaKc[d.etapa_fenologica as keyof typeof tablaKc] || 0.75;
  const ETc = ET0 * Kc;

  const tawPorMetro = TAW_TABLE[d.tipo_suelo] ?? 210;
  const raiz = ROOT_TABLE[d.etapa_fenologica] ?? 0.4;
  const TAW_total = tawPorMetro * raiz;
  const aguaAhora = TAW_total * (d.humedad_suelo_pct / 100);
  const umbralCritico = TAW_total * 0.5;
  const diasCriticos = ETc > 0 ? Math.max(0, Math.floor((aguaAhora - umbralCritico) / ETc)) : 99;

  let nivel: OfflineCalcResult['nivel'] = 'NORMAL';
  let aperturaPct = 0;
  if (diasCriticos <= 1) {
    nivel = 'SEVERO';
    aperturaPct = 80;
  } else if (diasCriticos <= 4) {
    nivel = 'LEVE';
    aperturaPct = 35;
  }

  return { et0: ET0, etc: ETc, taw: TAW_total, diasCriticos, nivel, aperturaPct };
}

export interface ForecastPoint {
  hour: number;
  pct: number;
  color: string;
}

export interface RiskEvent {
  label: string;
  time: string;
  desc: string;
  color: string;
}

export interface Predictions {
  diasCriticos: number;
  diasCriticosCritical: boolean;
  humIn24: string;
  forecast: ForecastPoint[];
  events: RiskEvent[];
}

// Mirrors computePredictions() — same etRate heuristic and thresholds.
export function computePredictions(
  data: CurrentData,
  claudeDiasSinIntervencion?: number,
): Predictions {
  const hum = data.humedad_suelo_pct;
  const dias = data.dias_sin_lluvia;
  const temp = data.temperatura_c;

  const etRate = (temp > 35 ? 3.5 : temp > 28 ? 2.5 : temp > 22 ? 1.8 : 1.2) + (dias > 10 ? 0.5 : 0);
  const humIn24 = Math.max(0, hum - etRate).toFixed(1);

  let diasCriticos = claudeDiasSinIntervencion !== undefined ? claudeDiasSinIntervencion : null;
  if (diasCriticos === null) {
    diasCriticos = hum > 25 ? Math.round((hum - 25) / etRate) : 0;
  }

  const forecast: ForecastPoint[] = [];
  for (let h = 0; h <= 7; h++) {
    const projected = Math.max(0, hum - etRate * h * 0.25);
    const pct = Math.min(100, projected);
    const color = pct < 25 ? '#b23a2c' : pct < 40 ? '#b8791f' : '#268a4a';
    forecast.push({ hour: h, pct, color });
  }

  const events: RiskEvent[] = [];
  if (hum > 25) {
    const daysToLeve = hum > 40 ? Math.round((hum - 40) / etRate) : 0;
    const daysToCrit = diasCriticos;
    if (daysToLeve > 0) {
      events.push({ label: 'Inicio estrés leve', time: `En ${daysToLeve} días`, desc: 'Humedad proyectada: 40%', color: '#b8791f' });
    }
    if (daysToCrit > 0) {
      events.push({ label: 'Estrés crítico', time: `En ${daysToCrit} días`, desc: 'Humedad por debajo del umbral del 25%', color: '#b23a2c' });
    }
  } else {
    events.push({ label: 'Estrés crítico activo', time: 'Ahora', desc: 'Se requiere intervención inmediata', color: '#b23a2c' });
  }
  events.push({ label: 'Revisión recomendada', time: 'En 24 horas', desc: 'Verificar condiciones del cultivo', color: '#2d6e8f' });

  return { diasCriticos, diasCriticosCritical: diasCriticos <= 1, humIn24, forecast, events };
}

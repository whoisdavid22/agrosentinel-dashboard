export const SUPABASE_URL = 'https://facjhtaljvpaadckwxlq.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_vx6W8FtzXRYZeQSG7DPSDA_qaiA0D_g';

export const WEBHOOK_URL = 'https://innowgp13.app.n8n.cloud/webhook/agente-hidrico';
export const CHAT_WEBHOOK_URL = 'https://innowgp13.app.n8n.cloud/webhook/copiloto-agrosentinel';
export const IMAGE_WEBHOOK_URL = 'https://innowgp13.app.n8n.cloud/webhook/analizar-imagen';
// Not real security (visible in client bundle) — just a casual-call deterrent, matches n8n IF check.
export const API_TOKEN = 'Agrosentinel-$VD-1234';

// Red de Parcelas: compartir está publicado y probado; stats devuelve vacío
// todavía (misma clase de bug que ya arreglamos en otros flujos, pendiente).
export const SHARED_SHARE_URL = 'https://innowgp13.app.n8n.cloud/webhook/red-compartir';
export const SHARED_STATS_URL = 'https://innowgp13.app.n8n.cloud/webhook/red-stats';

export const CAUDAL_MAX_VALVULA_LMIN = 4.2;

export const FAILSAFE_MINUTES = 5;

// Canon de aprovechamiento de agua, uso agropecuario, Costa Rica.
export const PRECIO_AGUA_COLONES_M3 = 1.29;
export function litrosAColones(litros: number) {
  return (litros / 1000) * PRECIO_AGUA_COLONES_M3;
}

export const KC_TABLE_GENERICO = {
  germinacion: 0.4,
  vegetativo: 0.75,
  floracion: 1.05,
  fructificacion: 1.05,
  maduracion: 0.85,
};

// Kc por cultivo: valores reales de Cuadros 26-28, Quesada (2017, TEC Costa Rica), citando FAO (2006).
export const KC_POR_CULTIVO: Record<string, typeof KC_TABLE_GENERICO> = {
  generico: KC_TABLE_GENERICO,
  cafe: { germinacion: 0.9, vegetativo: 0.93, floracion: 0.95, fructificacion: 0.95, maduracion: 0.95 },
  frijol: { germinacion: 0.4, vegetativo: 0.75, floracion: 1.15, fructificacion: 1.0, maduracion: 0.35 },
  tomate: { germinacion: 0.6, vegetativo: 0.85, floracion: 1.15, fructificacion: 1.1, maduracion: 0.8 },
  chile: { germinacion: 0.6, vegetativo: 0.8, floracion: 1.05, fructificacion: 1.0, maduracion: 0.9 },
  maiz: { germinacion: 0.3, vegetativo: 0.75, floracion: 1.2, fructificacion: 1.15, maduracion: 0.6 },
};

export const TAW_TABLE: Record<string, number> = {
  arenoso: 80,
  franco_arenoso: 150,
  franco: 210,
  franco_arcilloso: 180,
  arcilloso: 160,
};

export const ROOT_TABLE: Record<string, number> = {
  germinacion: 0.15,
  vegetativo: 0.4,
  floracion: 0.6,
  fructificacion: 0.7,
  maduracion: 0.7,
};

import type { Lang } from './translations';

export const CULTIVOS: Record<Lang, { value: string; label: string }[]> = {
  es: [
    { value: 'generico', label: 'Genérico (hortaliza/hilera)' },
    { value: 'cafe', label: 'Café' },
    { value: 'frijol', label: 'Frijol' },
    { value: 'tomate', label: 'Tomate' },
    { value: 'chile', label: 'Chile dulce' },
    { value: 'maiz', label: 'Maíz' },
  ],
  en: [
    { value: 'generico', label: 'Generic (vegetable/row crop)' },
    { value: 'cafe', label: 'Coffee' },
    { value: 'frijol', label: 'Beans' },
    { value: 'tomate', label: 'Tomato' },
    { value: 'chile', label: 'Bell pepper' },
    { value: 'maiz', label: 'Corn' },
  ],
};

export const ETAPAS: Record<Lang, { value: string; label: string }[]> = {
  es: [
    { value: 'germinacion', label: 'Germinación / establecimiento' },
    { value: 'vegetativo', label: 'Crecimiento vegetativo' },
    { value: 'floracion', label: 'Floración' },
    { value: 'fructificacion', label: 'Fructificación / llenado' },
    { value: 'maduracion', label: 'Maduración / cosecha' },
  ],
  en: [
    { value: 'germinacion', label: 'Germination / establishment' },
    { value: 'vegetativo', label: 'Vegetative growth' },
    { value: 'floracion', label: 'Flowering' },
    { value: 'fructificacion', label: 'Fruiting / fill' },
    { value: 'maduracion', label: 'Maturation / harvest' },
  ],
};

export const SUELOS: Record<Lang, { value: string; label: string }[]> = {
  es: [
    { value: 'arenoso', label: 'Arenoso' },
    { value: 'franco_arenoso', label: 'Franco-arenoso' },
    { value: 'franco', label: 'Franco' },
    { value: 'franco_arcilloso', label: 'Franco-arcilloso' },
    { value: 'arcilloso', label: 'Arcilloso' },
  ],
  en: [
    { value: 'arenoso', label: 'Sandy' },
    { value: 'franco_arenoso', label: 'Sandy loam' },
    { value: 'franco', label: 'Loam' },
    { value: 'franco_arcilloso', label: 'Clay loam' },
    { value: 'arcilloso', label: 'Clay' },
  ],
};

export const PHOTOS_POR_ALERTA: Record<Lang, Record<string, { url: string; label: string }>> = {
  es: {
    NORMAL: { url: 'https://images.unsplash.com/photo-1782087972248-82af30050866?fm=jpg&q=70&w=1200&auto=format&fit=crop', label: 'Cultivo saludable' },
    LEVE: { url: 'https://images.unsplash.com/photo-1783932751325-2f833a1e7101?fm=jpg&q=70&w=1200&auto=format&fit=crop', label: 'Estrés hídrico leve' },
    SEVERO: { url: 'https://images.unsplash.com/photo-1747122450139-6363248ec01f?fm=jpg&q=70&w=1200&auto=format&fit=crop', label: 'Estrés hídrico severo' },
  },
  en: {
    NORMAL: { url: 'https://images.unsplash.com/photo-1782087972248-82af30050866?fm=jpg&q=70&w=1200&auto=format&fit=crop', label: 'Healthy crop' },
    LEVE: { url: 'https://images.unsplash.com/photo-1783932751325-2f833a1e7101?fm=jpg&q=70&w=1200&auto=format&fit=crop', label: 'Mild water stress' },
    SEVERO: { url: 'https://images.unsplash.com/photo-1747122450139-6363248ec01f?fm=jpg&q=70&w=1200&auto=format&fit=crop', label: 'Severe water stress' },
  },
};

export const REGION_RANGES: Record<string, { rows: [number, number]; cols: [number, number] }> = {
  noroeste: { rows: [0, 2], cols: [0, 2] },
  norte: { rows: [0, 2], cols: [3, 4] },
  noreste: { rows: [0, 2], cols: [5, 7] },
  oeste: { rows: [3, 4], cols: [0, 2] },
  centro: { rows: [3, 4], cols: [3, 4] },
  este: { rows: [3, 4], cols: [5, 7] },
  suroeste: { rows: [5, 7], cols: [0, 2] },
  sur: { rows: [5, 7], cols: [3, 4] },
  sureste: { rows: [5, 7], cols: [5, 7] },
};

export const ALERT_COLORS: Record<string, string> = {
  NORMAL: '#268a4a',
  LEVE: '#b8791f',
  SEVERO: '#b23a2c',
};

export const MODEL_NAME = 'claude-sonnet-4-6';

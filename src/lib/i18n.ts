import type { TabId } from './tabs';

export const TAB_LABELS: Record<'es' | 'en', Record<TabId, string>> = {
  es: {
    decision: 'Decisión',
    valve3d: 'Válvula 3D',
    compare: 'Impacto y ODS',
    predictions: 'Predicciones',
    charts: 'Gráficas',
    map: 'Mapa',
    edge: 'Casos límite',
    simulador: 'Simulador',
    red: 'Red de Parcelas',
    telegram: 'Telegram',
    historial: 'Mi Historial',
    validacion: 'Validación Histórica',
  },
  en: {
    decision: 'Decision',
    valve3d: 'Valve 3D',
    compare: 'Impact & SDGs',
    predictions: 'Predictions',
    charts: 'Charts',
    map: 'Map',
    edge: 'Edge Cases',
    simulador: 'Simulator',
    red: 'Parcel Network',
    telegram: 'Telegram',
    historial: 'My History',
    validacion: 'Historical Validation',
  },
};

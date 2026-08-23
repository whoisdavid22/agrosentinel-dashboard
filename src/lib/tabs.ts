import { Droplets, Box, Globe2, TrendingUp, BarChart3, Map, Zap, FlaskConical, Share2, History, Satellite } from 'lucide-react';

export const TABS = [
  { id: 'decision', label: 'Decisión', icon: Droplets },
  { id: 'valve3d', label: 'Válvula 3D', icon: Box },
  { id: 'compare', label: 'Impacto y ODS', icon: Globe2 },
  { id: 'predictions', label: 'Predicciones', icon: TrendingUp },
  { id: 'charts', label: 'Gráficas', icon: BarChart3 },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'edge', label: 'Casos límite', icon: Zap },
  { id: 'simulador', label: 'Simulador', icon: FlaskConical },
  { id: 'red', label: 'Red de Parcelas', icon: Share2 },
  { id: 'historial', label: 'Mi Historial', icon: History },
  { id: 'validacion', label: 'Validación Histórica', icon: Satellite },
] as const;

export type TabId = (typeof TABS)[number]['id'];

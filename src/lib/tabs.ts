import { Droplets, Box, Globe2, TrendingUp, BarChart3, Map, Zap, FlaskConical, Share2, History, Satellite, Send } from 'lucide-react';

// Ordered by importance to the user's decision-making, not by build order.
// Válvula 3D is a visual/decorative view (the left panel already shows a
// live mini valve at all times), so it goes last rather than second.
export const TABS = [
  { id: 'decision', label: 'Decisión', icon: Droplets },
  { id: 'predictions', label: 'Predicciones', icon: TrendingUp },
  { id: 'compare', label: 'Impacto y ODS', icon: Globe2 },
  { id: 'charts', label: 'Gráficas', icon: BarChart3 },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'historial', label: 'Mi Historial', icon: History },
  { id: 'validacion', label: 'Validación Histórica', icon: Satellite },
  { id: 'simulador', label: 'Simulador', icon: FlaskConical },
  { id: 'edge', label: 'Casos límite', icon: Zap },
  { id: 'red', label: 'Red de Parcelas', icon: Share2 },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'valve3d', label: 'Válvula 3D', icon: Box },
] as const;

export type TabId = (typeof TABS)[number]['id'];

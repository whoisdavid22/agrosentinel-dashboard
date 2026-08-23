export interface CurrentData {
  ndvi: number;
  temperatura_c: number;
  humedad_suelo_pct: number;
  precipitacion_mm: number;
  dias_sin_lluvia: number;
  etapa_fenologica: string;
  tipo_suelo: string;
  cultivo: string;
  radiacion_solar?: number;
  temperatura_min_c?: number;
  temperatura_max_c?: number;
  observacion_dron?: string;
  lat?: number;
  lon?: number;
}

export type NivelAlerta = 'NORMAL' | 'LEVE' | 'SEVERO';
export type Confianza = 'ALTA' | 'MEDIA' | 'BAJA';

export interface RazonamientoItem {
  factor: string;
  peso: 'ALTO' | 'MEDIO' | 'BAJO';
  analisis: string;
}

export interface DecisionResponse {
  valvula: 'ABIERTA' | 'CERRADA';
  porcentaje_apertura?: number;
  nivel_alerta: NivelAlerta;
  accion: string;
  justificacion: string;
  razonamiento?: RazonamientoItem[];
  confianza?: Confianza;
  confianza_motivo?: string;
  litros_ahorrados_estimados?: number;
  dias_sin_intervencion?: number;
  et0_mm?: number;
  etc_mm?: number;
  taw_total_mm?: number;
  timestamp?: string;
}

export interface LogEntry {
  time: string;
  valvula: 'ABIERTA' | 'CERRADA';
  nivel_alerta: NivelAlerta;
  accion: string;
  snapshot: CurrentData;
}

export type FieldZoneState = 'ok' | 'leve' | 'severo';

export interface ImageZone {
  region: string;
  estado: 'normal' | 'leve' | 'severo';
}

export type ErrorTipo = 'timeout' | 'red' | 'http' | 'json' | 'estructura' | 'desconocido';

export interface FetchErrorInfo {
  tipo: ErrorTipo;
  mensaje: string;
}

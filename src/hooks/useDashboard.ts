import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  WEBHOOK_URL,
  CHAT_WEBHOOK_URL,
  IMAGE_WEBHOOK_URL,
  API_TOKEN,
  FAILSAFE_MINUTES,
  litrosAColones,
} from '../lib/constants';
import { calcularFAO56Local, computePredictions, type Predictions } from '../lib/faoCalc';
import type { CurrentData, DecisionResponse, LogEntry, FetchErrorInfo, ImageZone } from '../lib/types';
import type { User } from '@supabase/supabase-js';
import { t, type Lang } from '../lib/translations';

const ERROR_LABELS: Record<Lang, Record<string, string>> = {
  es: {
    timeout: 'Tiempo de espera agotado',
    red: 'Sin conexión con n8n',
    http: 'Error de n8n / Claude',
    json: 'Respuesta mal formada',
    estructura: 'Formato inesperado',
    desconocido: 'Error',
  },
  en: {
    timeout: 'Timed out',
    red: 'No connection to n8n',
    http: 'n8n / Claude error',
    json: 'Malformed response',
    estructura: 'Unexpected format',
    desconocido: 'Error',
  },
};

const DEFAULT_DATA: CurrentData = {
  ndvi: 0.6,
  temperatura_c: 25.0,
  humedad_suelo_pct: 50,
  precipitacion_mm: 5.0,
  dias_sin_lluvia: 5,
  etapa_fenologica: 'vegetativo',
  tipo_suelo: 'franco',
  cultivo: 'generico',
};

export const PRESETS: Record<string, Partial<CurrentData>> = {
  optimo: { ndvi: 0.78, temperatura_c: 23.5, humedad_suelo_pct: 70, precipitacion_mm: 14, dias_sin_lluvia: 1 },
  leve: { ndvi: 0.48, temperatura_c: 31.0, humedad_suelo_pct: 38, precipitacion_mm: 1.2, dias_sin_lluvia: 8 },
  severo: { ndvi: 0.2, temperatura_c: 39.0, humedad_suelo_pct: 13, precipitacion_mm: 0, dias_sin_lluvia: 22 },
  ambiguo: { ndvi: 0.6, temperatura_c: 33.0, humedad_suelo_pct: 28, precipitacion_mm: 0.5, dias_sin_lluvia: 6 },
};

// Label/description text lives in translations.ts (edge.case.<key>.*) — this holds only the scenario data.
export const EDGE_CASES: Record<string, { data: Partial<CurrentData> }> = {
  ndvi_alto_hum_baja: { data: { ndvi: 0.75, temperatura_c: 29.0, humedad_suelo_pct: 19, precipitacion_mm: 0, dias_sin_lluvia: 11 } },
  lluvia_reciente_dias_altos: { data: { ndvi: 0.35, temperatura_c: 26.0, humedad_suelo_pct: 33, precipitacion_mm: 22, dias_sin_lluvia: 19 } },
  temp_extrema_hum_ok: { data: { ndvi: 0.58, temperatura_c: 41.5, humedad_suelo_pct: 55, precipitacion_mm: 0, dias_sin_lluvia: 4 } },
  todo_limite: { data: { ndvi: 0.45, temperatura_c: 30.0, humedad_suelo_pct: 40, precipitacion_mm: 2, dias_sin_lluvia: 7 } },
};

export interface ChatMsg {
  who: 'user' | 'bot';
  text: string;
}

export interface HistorialRow {
  created_at: string;
  humedad_suelo_pct: number;
  ndvi: number;
  valvula: 'ABIERTA' | 'CERRADA';
  accion: string;
}

export function useDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentData, setCurrentData] = useState<CurrentData>(DEFAULT_DATA);
  const currentDataRef = useRef(currentData);
  currentDataRef.current = currentData;

  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<DecisionResponse | null>(null);
  const [offline, setOffline] = useState<{ active: boolean; etiqueta: string; calc: ReturnType<typeof calcularFAO56Local> } | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [apiErrorTipo, setApiErrorTipo] = useState<string | null>(null);

  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [decisionesHistorial, setDecisionesHistorial] = useState<DecisionResponse[]>([]);
  const [aguaAhorradaAcumulada, setAguaAhorradaAcumulada] = useState(0);
  const [analisisAcumulados, setAnalisisAcumulados] = useState(0);
  const [predictions, setPredictions] = useState<Predictions | null>(null);

  const [chartHistory, setChartHistory] = useState<{ labels: string[]; hum: number[]; ndvi: number[]; temp: number[]; prec: number[] }>({
    labels: [],
    hum: [],
    ndvi: [],
    temp: [],
    prec: [],
  });

  const [usingImageZones, setUsingImageZones] = useState(false);
  const [imageZones, setImageZones] = useState<ImageZone[] | null>(null);

  const [autoActive, setAutoActive] = useState(false);
  const [autoInterval, setAutoInterval] = useState(60);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [historial, setHistorial] = useState<HistorialRow[] | null>(null);
  const [historialStatus, setHistorialStatus] = useState('');

  const [lang, setLang] = useState<Lang>('es');

  const failsafeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Auth ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const updateField = useCallback((patch: Partial<CurrentData>) => {
    setCurrentData((d) => ({ ...d, ...patch }));
  }, []);

  const applyPreset = useCallback((name: keyof typeof PRESETS) => {
    setCurrentData((d) => ({ ...d, ...PRESETS[name] }));
  }, []);

  const triggerFailsafeClose = useCallback(() => {
    setLastResponse((prev) => ({
      ...(prev as DecisionResponse),
      valvula: 'CERRADA',
      porcentaje_apertura: 0,
      nivel_alerta: 'NORMAL',
      accion: 'Cierre automático de seguridad (failsafe)',
      justificacion: `Pasaron ${FAILSAFE_MINUTES} minutos sin una respuesta nueva del agente mientras la válvula estaba abierta. Por seguridad, el sistema cerró la válvula automáticamente para evitar riego descontrolado por una posible caída de conexión con n8n o Claude.`,
      razonamiento: [],
    }));
    setOffline(null);
    const now = new Date();
    setLogEntries((entries) => [
      { time: now.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), valvula: 'CERRADA', nivel_alerta: 'NORMAL', accion: 'Failsafe: cierre automático por inactividad del agente', snapshot: currentDataRef.current },
      ...entries,
    ]);
  }, []);

  const scheduleFailsafe = useCallback(
    (valvula: 'ABIERTA' | 'CERRADA') => {
      if (failsafeTimer.current) {
        clearTimeout(failsafeTimer.current);
        failsafeTimer.current = null;
      }
      if (valvula !== 'ABIERTA') return;
      failsafeTimer.current = setTimeout(triggerFailsafeClose, FAILSAFE_MINUTES * 60 * 1000);
    },
    [triggerFailsafeClose],
  );

  const guardarLecturaSupabase = useCallback(
    async (datos: CurrentData, decision: { valvula: string; nivel_alerta: string; accion: string }) => {
      if (!user) return;
      try {
        await supabase.from('Lecturas').insert({
          user_id: user.id,
          ndvi: datos.ndvi,
          temperatura_c: datos.temperatura_c,
          humedad_suelo_pct: datos.humedad_suelo_pct,
          precipitacion_mm: datos.precipitacion_mm,
          dias_sin_lluvia: datos.dias_sin_lluvia,
          valvula: decision.valvula,
          nivel_alerta: decision.nivel_alerta,
          accion: decision.accion,
        });
      } catch (err) {
        console.warn('No se pudo guardar la lectura en Supabase:', err);
      }
    },
    [user],
  );

  const runOfflineFallback = useCallback((errInfo: FetchErrorInfo) => {
    const calc = calcularFAO56Local(currentDataRef.current);
    const etiqueta = ERROR_LABELS[lang][errInfo.tipo] || ERROR_LABELS[lang].desconocido;
    setOffline({ active: true, etiqueta, calc });
    setLastResponse(null);
    setPredictions(computePredictions(currentDataRef.current, calc.diasCriticos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const addLogEntry = useCallback((data: DecisionResponse) => {
    const now = new Date();
    setLogEntries((entries) => [
      {
        time: now.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        valvula: data.valvula,
        nivel_alerta: data.nivel_alerta,
        accion: data.accion,
        snapshot: currentDataRef.current,
      },
      ...entries,
    ]);
  }, []);

  const updateCharts = useCallback(() => {
    setChartHistory((h) => {
      const timeLabel = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
      const d = currentDataRef.current;
      const next = {
        labels: [...h.labels, timeLabel],
        hum: [...h.hum, d.humedad_suelo_pct],
        ndvi: [...h.ndvi, Math.round(d.ndvi * 100)],
        temp: [...h.temp, d.temperatura_c],
        prec: [...h.prec, d.precipitacion_mm],
      };
      if (next.labels.length > 12) {
        next.labels.shift();
        next.hum.shift();
        next.ndvi.shift();
        next.temp.shift();
        next.prec.shift();
      }
      return next;
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setOffline(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const d = currentDataRef.current;
      const paramsObj: Record<string, string> = {
        ndvi: String(d.ndvi),
        temperatura_c: String(d.temperatura_c),
        humedad_suelo_pct: String(d.humedad_suelo_pct),
        precipitacion_mm: String(d.precipitacion_mm),
        dias_sin_lluvia: String(d.dias_sin_lluvia),
        etapa_fenologica: d.etapa_fenologica || 'vegetativo',
        tipo_suelo: d.tipo_suelo || 'franco',
        cultivo: d.cultivo || 'generico',
        idioma: lang,
        token: API_TOKEN,
      };
      if (d.radiacion_solar !== undefined) paramsObj.radiacion_solar = String(d.radiacion_solar);
      if (d.temperatura_min_c !== undefined) paramsObj.temperatura_min_c = String(d.temperatura_min_c);
      if (d.temperatura_max_c !== undefined) paramsObj.temperatura_max_c = String(d.temperatura_max_c);
      if (d.observacion_dron) paramsObj.observacion_dron = d.observacion_dron;
      if (d.lat !== undefined && d.lon !== undefined) {
        paramsObj.lat = String(d.lat);
        paramsObj.lon = String(d.lon);
      }
      if (decisionesHistorial.length > 0) {
        paramsObj.decisiones_previas = JSON.stringify(
          decisionesHistorial.slice(-3).map((r) => ({ valvula: r.valvula, nivel_alerta: r.nivel_alerta, accion: r.accion })),
        );
      }
      const params = new URLSearchParams(paramsObj);

      let res: Response;
      try {
        res = await fetch(WEBHOOK_URL + '?' + params.toString(), { signal: controller.signal });
      } catch (networkErr) {
        if ((networkErr as Error).name === 'AbortError') {
          throw { tipo: 'timeout', mensaje: 'n8n no respondió en 20 segundos.' } as FetchErrorInfo;
        }
        throw { tipo: 'red', mensaje: 'No se pudo contactar a n8n.' } as FetchErrorInfo;
      }
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw { tipo: 'http', mensaje: `n8n respondió con error HTTP ${res.status}.` } as FetchErrorInfo;
      }

      let data: DecisionResponse;
      try {
        const raw = await res.json();
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        throw { tipo: 'json', mensaje: 'La respuesta de n8n no vino en formato JSON válido.' } as FetchErrorInfo;
      }

      if (!data || !data.valvula) {
        throw { tipo: 'estructura', mensaje: 'La respuesta llegó pero no tiene el formato esperado.' } as FetchErrorInfo;
      }

      setLastResponse(data);
      setApiStatus('ok');
      setApiErrorTipo(null);

      addLogEntry(data);
      guardarLecturaSupabase(d, data);
      updateCharts();
      setPredictions(computePredictions(d, data.dias_sin_intervencion));

      setDecisionesHistorial((hist) => {
        const next = [...hist, data];
        return next.length > 3 ? next.slice(-3) : next;
      });

      if (typeof data.litros_ahorrados_estimados === 'number') {
        setAguaAhorradaAcumulada((v) => v + data.litros_ahorrados_estimados!);
        setAnalisisAcumulados((v) => v + 1);
      }

      scheduleFailsafe(data.valvula);
    } catch (err) {
      clearTimeout(timeoutId);
      const info: FetchErrorInfo =
        err && typeof err === 'object' && 'tipo' in err
          ? (err as FetchErrorInfo)
          : { tipo: 'desconocido', mensaje: (err as Error)?.message || 'Error desconocido al contactar el agente.' };
      setApiStatus('error');
      setApiErrorTipo(info.tipo);
      runOfflineFallback(info);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, lang, decisionesHistorial, addLogEntry, guardarLecturaSupabase, updateCharts, scheduleFailsafe, runOfflineFallback]);

  // ---- Auto polling ----
  useEffect(() => {
    if (!autoActive) {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      setAutoCountdown(null);
      return;
    }
    let cd = autoInterval;
    setAutoCountdown(cd);
    countdownTimer.current = setInterval(() => {
      cd -= 1;
      setAutoCountdown(cd);
      if (cd <= 0 && countdownTimer.current) clearInterval(countdownTimer.current);
    }, 1000);
    autoTimer.current = setTimeout(() => {
      fetchData();
    }, autoInterval * 1000);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoActive, autoInterval, lastResponse, offline]);

  const toggleAuto = useCallback(() => {
    setAutoActive((v) => {
      const next = !v;
      if (next) fetchData();
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  // ---- Image analysis ----
  const analyzeImage = useCallback(async (base64: string, mediaType: string): Promise<{ analisis: string; zonas?: ImageZone[] }> => {
    const res = await fetch(IMAGE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: base64, media_type: mediaType, token: API_TOKEN }),
    });
    let data = await res.json();
    if (typeof data === 'string') data = JSON.parse(data);
    if (data.analisis) {
      setCurrentData((d) => ({ ...d, observacion_dron: `${d.observacion_dron || ''} ${data.analisis}`.trim() }));
    }
    if (data.zonas && Array.isArray(data.zonas) && data.zonas.length > 0) {
      setUsingImageZones(true);
      setImageZones(data.zonas);
    }
    return data;
  }, []);

  const resetMapToSimulation = useCallback(() => {
    setUsingImageZones(false);
    setImageZones(null);
  }, []);

  // ---- Copilot chat ----
  const sendCopilotMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setChatMessages((m) => [...m, { who: 'user', text }]);
      setChatLoading(true);
      try {
        const res = await fetch(CHAT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pregunta: text,
            contexto: {
              ndvi: currentDataRef.current.ndvi,
              temperatura_c: currentDataRef.current.temperatura_c,
              humedad_suelo_pct: currentDataRef.current.humedad_suelo_pct,
              dias_sin_lluvia: currentDataRef.current.dias_sin_lluvia,
              ultima_decision: lastResponse ? lastResponse.accion : null,
            },
            token: API_TOKEN,
          }),
        });
        const data = await res.json();
        setChatMessages((m) => [...m, { who: 'bot', text: data.respuesta || t(lang, 'copilot.noResponse') }]);
      } catch {
        setChatMessages((m) => [...m, { who: 'bot', text: t(lang, 'copilot.failed') }]);
      } finally {
        setChatLoading(false);
      }
    },
    [lastResponse, lang],
  );

  // ---- Historial real (Supabase) ----
  const cargarHistorialReal = useCallback(async () => {
    if (!user) {
      setHistorialStatus(t(lang, 'hist.loginRequired'));
      return;
    }
    setHistorialStatus(t(lang, 'hist.querying'));
    try {
      const { data, error } = await supabase
        .from('Lecturas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      if (!data || data.length === 0) {
        setHistorialStatus(t(lang, 'hist.empty'));
        setHistorial([]);
        return;
      }
      setHistorialStatus(t(lang, 'hist.found', data.length));
      setHistorial(data as HistorialRow[]);
    } catch (err) {
      setHistorialStatus(t(lang, 'hist.error', (err as Error).message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, lang]);

  // ---- Demo mode ----
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoNarration, setDemoNarration] = useState<string | null>(null);

  const runDemoMode = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    const pasos = [
      { preset: 'severo' as const, espera: 4000, narracion: t(lang, 'demo.step1') },
      { preset: 'leve' as const, espera: 4000, narracion: t(lang, 'demo.step2') },
      { preset: 'optimo' as const, espera: 0, narracion: t(lang, 'demo.step3') },
    ];
    setDemoNarration(t(lang, 'demo.starting'));
    for (const paso of pasos) {
      setDemoNarration(paso.narracion);
      applyPreset(paso.preset);
      await new Promise((r) => setTimeout(r, 700));
      await fetchData();
      if (paso.espera) await new Promise((r) => setTimeout(r, paso.espera));
    }
    setDemoNarration(t(lang, 'demo.complete'));
    await new Promise((r) => setTimeout(r, 3500));
    setDemoNarration(null);
    setDemoRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoRunning, applyPreset, fetchData]);

  const applyEdgeCase = useCallback(
    async (name: keyof typeof EDGE_CASES) => {
      setCurrentData((d) => ({ ...d, ...EDGE_CASES[name].data }));
      await new Promise((r) => setTimeout(r, 50));
      await fetchData();
    },
    [fetchData],
  );

  const impact = lastResponse
    ? {
        diasNo: lastResponse.dias_sin_intervencion,
        litros: lastResponse.litros_ahorrados_estimados ?? 0,
        colones: litrosAColones(lastResponse.litros_ahorrados_estimados ?? 0),
      }
    : null;

  const apiStatusLabel =
    apiStatus === 'idle'
      ? t(lang, 'status.idle')
      : apiStatus === 'ok'
        ? t(lang, 'status.ok')
        : t(lang, 'status.error', ERROR_LABELS[lang][apiErrorTipo ?? 'desconocido'] || ERROR_LABELS[lang].desconocido);

  return {
    user,
    authLoading,
    currentData,
    updateField,
    applyPreset,
    isLoading,
    lastResponse,
    offline,
    apiStatus,
    apiStatusLabel,
    fetchData,
    logEntries,
    predictions,
    impact,
    aguaAhorradaAcumulada,
    analisisAcumulados,
    chartHistory,
    usingImageZones,
    imageZones,
    analyzeImage,
    resetMapToSimulation,
    autoActive,
    autoInterval,
    setAutoInterval,
    autoCountdown,
    toggleAuto,
    chatMessages,
    chatLoading,
    sendCopilotMessage,
    historial,
    historialStatus,
    cargarHistorialReal,
    lang,
    setLang,
    demoRunning,
    demoNarration,
    runDemoMode,
    applyEdgeCase,
  };
}

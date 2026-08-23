import { useState } from 'react';
import { ChevronDown, Crosshair, Play, Radio } from 'lucide-react';
import Slider from './Slider';
import MiniValve from './MiniValve';
import AlertGauge from './AlertGauge';
import { CULTIVOS, ETAPAS, SUELOS } from '../lib/constants';
import type { CurrentData, DecisionResponse, ImageZone } from '../lib/types';
import type { OfflineCalcResult } from '../lib/faoCalc';

interface LeftPanelProps {
  currentData: CurrentData;
  updateField: (patch: Partial<CurrentData>) => void;
  fetchData: () => void;
  isLoading: boolean;
  lastResponse: DecisionResponse | null;
  offline: { active: boolean; etiqueta: string; calc: OfflineCalcResult } | null;
  autoActive: boolean;
  toggleAuto: () => void;
  autoInterval: number;
  setAutoInterval: (v: number) => void;
  autoCountdown: number | null;
  demoRunning: boolean;
  runDemoMode: () => void;
  analyzeImage: (base64: string, mediaType: string) => Promise<{ analisis: string; zonas?: ImageZone[] }>;
}

export default function LeftPanel({
  currentData,
  updateField,
  fetchData,
  isLoading,
  lastResponse,
  offline,
  autoActive,
  toggleAuto,
  autoInterval,
  setAutoInterval,
  autoCountdown,
  demoRunning,
  runDemoMode,
  analyzeImage,
}: LeftPanelProps) {
  const [showOptional, setShowOptional] = useState(false);
  const [useRadiacion, setUseRadiacion] = useState(false);
  const [useTempRango, setUseTempRango] = useState(false);
  const [useDron, setUseDron] = useState(false);
  const [useNasa, setUseNasa] = useState(false);

  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgBase64, setImgBase64] = useState<string | null>(null);
  const [imgMediaType, setImgMediaType] = useState<string | null>(null);
  const [imgAnalyzing, setImgAnalyzing] = useState(false);
  const [imgResult, setImgResult] = useState<string | null>(null);

  function onImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgMediaType(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImgPreview(dataUrl);
      setImgBase64(dataUrl.split(',')[1]);
      setImgResult(null);
    };
    reader.readAsDataURL(file);
  }

  async function onAnalyzeImage() {
    if (!imgBase64 || !imgMediaType) {
      alert('Selecciona una imagen primero.');
      return;
    }
    setImgAnalyzing(true);
    setImgResult('Enviando imagen a Claude Vision...');
    try {
      const data = await analyzeImage(imgBase64, imgMediaType);
      let text = data.analisis || 'No se obtuvo un análisis claro.';
      if (data.zonas && data.zonas.length > 0) text += ' — el mapa de campo se actualizó con estas zonas.';
      setImgResult(text);
    } catch {
      setImgResult('No se pudo analizar la imagen. Verifica el endpoint "analizar-imagen".');
    } finally {
      setImgAnalyzing(false);
    }
  }

  const pct = offline
    ? offline.calc.aperturaPct
    : lastResponse
      ? (typeof lastResponse.porcentaje_apertura === 'number' ? lastResponse.porcentaje_apertura : lastResponse.valvula === 'ABIERTA' ? 100 : 0)
      : 0;
  const level = offline ? offline.calc.nivel : lastResponse?.nivel_alerta ?? null;

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => updateField({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => alert('No se pudo obtener tu ubicación. Ingrésala manualmente.'),
    );
  }

  return (
    <aside className="w-full lg:w-[320px] shrink-0 bg-[#141416] border-r border-white/5 flex flex-col overflow-y-auto">
      <div className="p-5 flex flex-col items-center border-b border-white/5">
        <MiniValve pct={pct} />
        <p className="font-jetbrains text-sm text-white mt-2">
          {pct === 0 ? 'CERRADA' : pct === 100 ? 'ABIERTA' : `ABIERTA ${Math.round(pct)}%`}
        </p>
        <p className="text-[11px] text-white/40 mb-3">{pct === 0 ? 'Sin flujo activo' : pct < 100 ? 'Riego dosificado' : 'Riego activo'}</p>
        <AlertGauge level={level} />
      </div>

      <div className="p-5 flex flex-col">
        <Slider label="NDVI" value={currentData.ndvi} min={0} max={1} step={0.01} display={currentData.ndvi.toFixed(2)} onChange={(v) => updateField({ ndvi: v })} />
        <Slider label="Temperatura" value={currentData.temperatura_c} min={0} max={50} step={0.1} display={`${currentData.temperatura_c.toFixed(1)}°C`} onChange={(v) => updateField({ temperatura_c: v })} />
        <Slider label="Humedad del suelo" value={currentData.humedad_suelo_pct} min={0} max={100} step={1} display={`${currentData.humedad_suelo_pct}%`} onChange={(v) => updateField({ humedad_suelo_pct: v })} />
        <Slider label="Precipitación" value={currentData.precipitacion_mm} min={0} max={30} step={0.1} display={`${currentData.precipitacion_mm.toFixed(1)}mm`} onChange={(v) => updateField({ precipitacion_mm: v })} />
        <Slider label="Días sin lluvia" value={currentData.dias_sin_lluvia} min={0} max={30} step={1} display={`${currentData.dias_sin_lluvia}`} onChange={(v) => updateField({ dias_sin_lluvia: v })} />

        <FieldSelect label="Etapa fenológica" value={currentData.etapa_fenologica} options={ETAPAS} onChange={(v) => updateField({ etapa_fenologica: v })} />
        <FieldSelect label="Tipo de suelo" value={currentData.tipo_suelo} options={SUELOS} onChange={(v) => updateField({ tipo_suelo: v })} />
        <FieldSelect label="Cultivo" value={currentData.cultivo} options={CULTIVOS} onChange={(v) => updateField({ cultivo: v })} />

        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/50 hover:text-white/80 py-2 border-t border-white/5 mt-2"
        >
          <span>Datos opcionales avanzados</span>
          <ChevronDown size={14} className={`transition-transform ${showOptional ? 'rotate-180' : ''}`} />
        </button>

        {showOptional && (
          <div className="pt-2">
            <OptionalCheck
              label="Radiación solar (NASA)"
              checked={useRadiacion}
              onChange={(on) => {
                setUseRadiacion(on);
                if (on) updateField({ radiacion_solar: 18 });
                else updateField({ radiacion_solar: undefined });
              }}
            />
            {useRadiacion && (
              <Slider label="Radiación" value={currentData.radiacion_solar ?? 18} min={0} max={35} step={0.1} display={`${(currentData.radiacion_solar ?? 18).toFixed(1)} MJ/m²/día`} onChange={(v) => updateField({ radiacion_solar: v })} />
            )}

            <OptionalCheck
              label="Rango de temperatura (min/máx)"
              checked={useTempRango}
              onChange={(on) => {
                setUseTempRango(on);
                if (on) updateField({ temperatura_min_c: 15, temperatura_max_c: 32 });
                else updateField({ temperatura_min_c: undefined, temperatura_max_c: undefined });
              }}
            />
            {useTempRango && (
              <>
                <Slider label="Mínima" value={currentData.temperatura_min_c ?? 15} min={-5} max={40} step={0.1} display={`${(currentData.temperatura_min_c ?? 15).toFixed(1)}°C`} onChange={(v) => updateField({ temperatura_min_c: v })} />
                <Slider label="Máxima" value={currentData.temperatura_max_c ?? 32} min={-5} max={50} step={0.1} display={`${(currentData.temperatura_max_c ?? 32).toFixed(1)}°C`} onChange={(v) => updateField({ temperatura_max_c: v })} />
              </>
            )}

            <OptionalCheck
              label="Observación de dron / campo"
              checked={useDron}
              onChange={(on) => {
                setUseDron(on);
                if (!on) updateField({ observacion_dron: undefined });
              }}
            />
            {useDron && (
              <>
                <textarea
                  value={currentData.observacion_dron ?? ''}
                  onChange={(e) => updateField({ observacion_dron: e.target.value })}
                  placeholder="Ej: hojas amarillentas en el sector norte..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none mb-2 resize-none"
                  rows={2}
                />
                <p className="text-[10px] text-white/40 mb-2">O sube una foto para que Claude la analice directamente:</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageSelected}
                  className="w-full text-[11px] text-white/60 mb-2 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-white/70 file:text-[11px]"
                />
                {imgPreview && <img src={imgPreview} alt="Vista previa" className="w-full rounded-lg mb-2 ring-1 ring-white/10" />}
                <button
                  type="button"
                  onClick={onAnalyzeImage}
                  disabled={imgAnalyzing}
                  className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-full transition-colors mb-2"
                >
                  {imgAnalyzing ? 'Analizando imagen...' : 'Analizar imagen con Claude'}
                </button>
                {imgResult && (
                  <div className="text-[11px] text-white/60 leading-relaxed p-2.5 bg-white/5 rounded-lg border-l-2 border-[#7d2c44] mb-2">
                    {imgResult}
                  </div>
                )}
              </>
            )}

            <OptionalCheck
              label="Coordenadas (clima NASA POWER)"
              checked={useNasa}
              onChange={(on) => {
                setUseNasa(on);
                if (!on) updateField({ lat: undefined, lon: undefined });
              }}
            />
            {useNasa && (
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  placeholder="Lat"
                  value={currentData.lat ?? ''}
                  onChange={(e) => updateField({ lat: parseFloat(e.target.value) || undefined })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                />
                <input
                  type="number"
                  placeholder="Lon"
                  value={currentData.lon ?? ''}
                  onChange={(e) => updateField({ lon: parseFloat(e.target.value) || undefined })}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                />
                <button type="button" onClick={useMyLocation} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" aria-label="Usar mi ubicación">
                  <Crosshair size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="mt-3 bg-[#7d2c44] hover:bg-[#5e2033] disabled:opacity-50 text-white text-sm font-medium py-3 rounded-full transition-colors"
        >
          {isLoading ? 'Analizando...' : 'Analizar con Claude AI'}
        </button>

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={toggleAuto}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-full border transition-colors ${
              autoActive ? 'bg-[#268a4a]/15 border-[#268a4a]/40 text-[#268a4a]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Radio size={12} />
            Auto: {autoActive ? 'ON' : 'OFF'} {autoActive && autoCountdown !== null ? `(${autoCountdown}s)` : ''}
          </button>
          <select
            value={autoInterval}
            onChange={(e) => setAutoInterval(parseInt(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-full px-2 py-2 text-xs text-white outline-none"
          >
            {[30, 60, 120, 300].map((s) => (
              <option key={s} value={s} className="bg-[#141416]">
                {s}s
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={runDemoMode}
          disabled={demoRunning}
          className="mt-2 flex items-center justify-center gap-1.5 bg-[#8f5da6]/20 hover:bg-[#8f5da6]/30 disabled:opacity-50 text-[#c9a8dd] text-xs font-medium py-2 rounded-full transition-colors"
        >
          <Play size={12} />
          {demoRunning ? 'Demo en curso...' : 'Modo demo'}
        </button>
      </div>
    </aside>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="slider-label block text-[11px] uppercase tracking-wide text-white/50 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#141416]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function OptionalCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-white/70 mb-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[#7d2c44]" />
      {label}
    </label>
  );
}

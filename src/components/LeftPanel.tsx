import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Crosshair, Play, Radio } from 'lucide-react';
import Slider from './Slider';
import MiniValve from './MiniValve';
import AlertGauge from './AlertGauge';
import { CULTIVOS, ETAPAS, SUELOS } from '../lib/constants';
import { makeT, type Lang } from '../lib/translations';
import type { CurrentData, DecisionResponse, ImageZone } from '../lib/types';
import type { OfflineCalcResult } from '../lib/faoCalc';

interface LeftPanelProps {
  lang: Lang;
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
  lang,
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
  const tr = makeT(lang);

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
      alert(tr('error.selectImageFirst'));
      return;
    }
    setImgAnalyzing(true);
    setImgResult(tr('img.sending'));
    try {
      const data = await analyzeImage(imgBase64, imgMediaType);
      let text = data.analisis || tr('img.noAnalysis');
      if (data.zonas && data.zonas.length > 0) text += tr('img.mapUpdated');
      setImgResult(text);
    } catch {
      setImgResult(tr('img.failed'));
    } finally {
      setImgAnalyzing(false);
    }
  }

  const pct = offline
    ? offline.calc.aperturaPct
    : lastResponse
      ? (typeof lastResponse.porcentaje_apertura === 'number' ? lastResponse.porcentaje_apertura : lastResponse.valvula === 'ABIERTA' ? 100 : 0)
      : 0;
  const level = offline ? offline.calc.nivel : (lastResponse?.nivel_alerta ?? null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert(tr('error.geoUnsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => updateField({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => alert(tr('error.geoFailed')),
    );
  }

  return (
    <aside className="w-full lg:w-[320px] shrink-0 bg-[#141416] border-r border-white/5 flex flex-col overflow-y-auto">
      <div className="p-5 flex flex-col items-center border-b border-white/5">
        <MiniValve pct={pct} />
        <motion.p
          key={pct === 0 ? 'closed' : pct === 100 ? 'open' : `open-${Math.round(pct)}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-jetbrains text-sm text-white mt-2"
        >
          {pct === 0 ? tr('panel.valve.closed') : pct === 100 ? tr('panel.valve.open') : `${tr('panel.valve.open')} ${Math.round(pct)}%`}
        </motion.p>
        <p className="text-[11px] text-white/40 mb-3">
          {pct === 0 ? tr('panel.valve.noFlow') : pct < 100 ? tr('panel.valve.doseFlow') : tr('panel.valve.activeFlow')}
        </p>
        <AlertGauge level={level} />
      </div>

      <div className="p-5 flex flex-col">
        <Slider label={tr('field.ndvi')} value={currentData.ndvi} min={0} max={1} step={0.01} display={currentData.ndvi.toFixed(2)} onChange={(v) => updateField({ ndvi: v })} />
        <Slider label={tr('field.temp')} value={currentData.temperatura_c} min={0} max={50} step={0.1} display={`${currentData.temperatura_c.toFixed(1)}°C`} onChange={(v) => updateField({ temperatura_c: v })} />
        <Slider label={tr('field.hum')} value={currentData.humedad_suelo_pct} min={0} max={100} step={1} display={`${currentData.humedad_suelo_pct}%`} onChange={(v) => updateField({ humedad_suelo_pct: v })} />
        <Slider label={tr('field.prec')} value={currentData.precipitacion_mm} min={0} max={30} step={0.1} display={`${currentData.precipitacion_mm.toFixed(1)}mm`} onChange={(v) => updateField({ precipitacion_mm: v })} />
        <Slider label={tr('field.dias')} value={currentData.dias_sin_lluvia} min={0} max={30} step={1} display={`${currentData.dias_sin_lluvia}`} onChange={(v) => updateField({ dias_sin_lluvia: v })} />

        <FieldSelect label={tr('field.etapa')} value={currentData.etapa_fenologica} options={ETAPAS[lang]} onChange={(v) => updateField({ etapa_fenologica: v })} />
        <FieldSelect label={tr('field.suelo')} value={currentData.tipo_suelo} options={SUELOS[lang]} onChange={(v) => updateField({ tipo_suelo: v })} />
        <FieldSelect label={tr('field.cultivo')} value={currentData.cultivo} options={CULTIVOS[lang]} onChange={(v) => updateField({ cultivo: v })} />

        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/50 hover:text-white/80 py-2 border-t border-white/5 mt-2"
        >
          <span>{tr('field.optionalToggle')}</span>
          <motion.span animate={{ rotate: showOptional ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={14} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {showOptional && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <OptionalCheck
                  label={tr('field.radiacion')}
                  checked={useRadiacion}
                  onChange={(on) => {
                    setUseRadiacion(on);
                    if (on) updateField({ radiacion_solar: 18 });
                    else updateField({ radiacion_solar: undefined });
                  }}
                />
                {useRadiacion && (
                  <Slider
                    label={tr('field.radiacion')}
                    value={currentData.radiacion_solar ?? 18}
                    min={0}
                    max={35}
                    step={0.1}
                    display={`${(currentData.radiacion_solar ?? 18).toFixed(1)} ${tr('field.radiacionUnit')}`}
                    onChange={(v) => updateField({ radiacion_solar: v })}
                  />
                )}

                <OptionalCheck
                  label={tr('field.tempRango')}
                  checked={useTempRango}
                  onChange={(on) => {
                    setUseTempRango(on);
                    if (on) updateField({ temperatura_min_c: 15, temperatura_max_c: 32 });
                    else updateField({ temperatura_min_c: undefined, temperatura_max_c: undefined });
                  }}
                />
                {useTempRango && (
                  <>
                    <Slider label={tr('field.tempMin')} value={currentData.temperatura_min_c ?? 15} min={-5} max={40} step={0.1} display={`${(currentData.temperatura_min_c ?? 15).toFixed(1)}°C`} onChange={(v) => updateField({ temperatura_min_c: v })} />
                    <Slider label={tr('field.tempMax')} value={currentData.temperatura_max_c ?? 32} min={-5} max={50} step={0.1} display={`${(currentData.temperatura_max_c ?? 32).toFixed(1)}°C`} onChange={(v) => updateField({ temperatura_max_c: v })} />
                  </>
                )}

                <OptionalCheck
                  label={tr('field.dron')}
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
                      placeholder={tr('field.dronPlaceholder')}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none mb-2 resize-none"
                      rows={2}
                    />
                    <p className="text-[10px] text-white/40 mb-2">{tr('field.dronPhotoHint')}</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onImageSelected}
                      className="w-full text-[11px] text-white/60 mb-2 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-white/10 file:text-white/70 file:text-[11px]"
                    />
                    {imgPreview && <img src={imgPreview} alt="" className="w-full rounded-lg mb-2 ring-1 ring-white/10" />}
                    <button
                      type="button"
                      onClick={onAnalyzeImage}
                      disabled={imgAnalyzing}
                      className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-full transition-colors mb-2"
                    >
                      {imgAnalyzing ? tr('btn.analyzingImage') : tr('btn.analyzeImage')}
                    </button>
                    {imgResult && <div className="text-[11px] text-white/60 leading-relaxed p-2.5 bg-white/5 rounded-lg border-l-2 border-[#7d2c44] mb-2">{imgResult}</div>}
                  </>
                )}

                <OptionalCheck
                  label={tr('field.nasa')}
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
                      placeholder={tr('field.lat')}
                      value={currentData.lat ?? ''}
                      onChange={(e) => updateField({ lat: parseFloat(e.target.value) || undefined })}
                      className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                    />
                    <input
                      type="number"
                      placeholder={tr('field.lon')}
                      value={currentData.lon ?? ''}
                      onChange={(e) => updateField({ lon: parseFloat(e.target.value) || undefined })}
                      className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                    />
                    <button type="button" onClick={useMyLocation} className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" aria-label={tr('alert.useMyLocation')}>
                      <Crosshair size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 bg-[#7d2c44] hover:bg-[#5e2033] disabled:opacity-50 text-white text-sm font-medium py-3 rounded-full transition-colors"
        >
          {isLoading ? tr('btn.analyzing') : tr('btn.analyze')}
        </motion.button>

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={toggleAuto}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-full border transition-colors ${
              autoActive ? 'bg-[#268a4a]/15 border-[#268a4a]/40 text-[#268a4a]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Radio size={12} />
            {autoActive ? tr('btn.autoOn') : tr('btn.autoOff')} {autoActive && autoCountdown !== null ? `(${autoCountdown}s)` : ''}
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

        <motion.button
          type="button"
          onClick={runDemoMode}
          disabled={demoRunning}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          className="mt-2 flex items-center justify-center gap-1.5 bg-[#8f5da6]/20 hover:bg-[#8f5da6]/30 disabled:opacity-50 text-[#c9a8dd] text-xs font-medium py-2 rounded-full transition-colors"
        >
          <Play size={12} />
          {demoRunning ? tr('btn.demoRunning') : tr('btn.demo')}
        </motion.button>
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

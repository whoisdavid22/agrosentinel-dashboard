import { motion } from 'framer-motion';
import { makeT, type Lang } from '../../lib/translations';
import type { TelegramVinculo } from '../../lib/types';

interface TelegramTabProps {
  lang: Lang;
  telegramVinculo: TelegramVinculo | null;
  telegramCodigo: string | null;
  telegramGenerating: boolean;
  telegramStatus: string;
  cargarVinculoTelegram: () => void;
  generarCodigoTelegram: () => void;
  desvincularTelegram: () => void;
}

export default function TelegramTab({
  lang,
  telegramVinculo,
  telegramCodigo,
  telegramGenerating,
  telegramStatus,
  cargarVinculoTelegram,
  generarCodigoTelegram,
  desvincularTelegram,
}: TelegramTabProps) {
  const tr = makeT(lang);
  const fecha = telegramVinculo ? new Date(telegramVinculo.vinculado_at).toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US') : '';

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <p className="text-sm text-white/50 mb-1">{tr('telegram.intro')}</p>
        <p className="text-xs text-white/30 mb-4">{tr('telegram.botHandle')}</p>

        {telegramVinculo ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#268a4a]" />
              <span className="text-sm text-white font-medium">{tr('telegram.linked')}</span>
            </div>
            <p className="text-xs text-white/40 mb-4">{tr('telegram.linkedSince', fecha)}</p>
            <button
              type="button"
              onClick={desvincularTelegram}
              className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
            >
              {tr('telegram.unlinkBtn')}
            </button>
          </motion.div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-sm text-white/60">{tr('telegram.notLinked')}</span>
            </div>

            {telegramCodigo ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <p className="text-xs text-white/50 mb-2">{tr('telegram.codeInstructions')}</p>
                <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-2">
                  <code className="text-lg text-white font-mono tracking-widest">/vincular {telegramCodigo}</code>
                </div>
                <p className="text-[11px] text-white/30">{tr('telegram.codeExpires')}</p>
              </motion.div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={generarCodigoTelegram}
                disabled={telegramGenerating}
                className="bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
              >
                {telegramGenerating ? tr('telegram.generating') : tr('telegram.generateBtn')}
              </button>
              {telegramCodigo && (
                <button
                  type="button"
                  onClick={cargarVinculoTelegram}
                  className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
                >
                  {tr('telegram.refreshBtn')}
                </button>
              )}
            </div>
          </div>
        )}

        {telegramStatus && <p className="text-xs text-white/40 mt-4">{telegramStatus}</p>}
      </div>
    </div>
  );
}

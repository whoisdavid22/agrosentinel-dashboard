import { motion } from 'framer-motion';
import { EDGE_CASES } from '../../hooks/useDashboard';
import { t, makeT, type Lang, type TKey } from '../../lib/translations';

interface EdgeTabProps {
  lang: Lang;
  applyEdgeCase: (name: keyof typeof EDGE_CASES) => void;
  isLoading: boolean;
}

export default function EdgeTab({ lang, applyEdgeCase, isLoading }: EdgeTabProps) {
  const tr = makeT(lang);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/50">{tr('edge.intro')}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {(Object.keys(EDGE_CASES) as (keyof typeof EDGE_CASES)[]).map((key, i) => (
          <motion.button
            key={key}
            type="button"
            disabled={isLoading}
            onClick={() => applyEdgeCase(key)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="text-left rounded-2xl bg-white/[0.03] ring-1 ring-white/5 hover:ring-white/15 disabled:opacity-50 p-5 transition-colors"
          >
            <div className="text-sm font-medium text-white mb-1.5">{t(lang, `edge.case.${key}.label` as TKey)}</div>
            <div className="text-xs text-white/50 leading-relaxed">{t(lang, `edge.case.${key}.desc` as TKey)}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

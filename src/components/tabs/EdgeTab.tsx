import { EDGE_CASES } from '../../hooks/useDashboard';

interface EdgeTabProps {
  applyEdgeCase: (name: keyof typeof EDGE_CASES) => void;
  isLoading: boolean;
}

export default function EdgeTab({ applyEdgeCase, isLoading }: EdgeTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/50">
        Escenarios con datos deliberadamente contradictorios, para observar cómo Claude pondera factores en conflicto en
        lugar de seguir una sola regla simple.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {(Object.entries(EDGE_CASES) as [keyof typeof EDGE_CASES, (typeof EDGE_CASES)[keyof typeof EDGE_CASES]][]).map(([key, c]) => (
          <button
            key={key}
            type="button"
            disabled={isLoading}
            onClick={() => applyEdgeCase(key)}
            className="text-left rounded-2xl bg-white/[0.03] ring-1 ring-white/5 hover:ring-white/15 disabled:opacity-50 p-5 transition-colors"
          >
            <div className="text-sm font-medium text-white mb-1.5">{c.label}</div>
            <div className="text-xs text-white/50 leading-relaxed">{c.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

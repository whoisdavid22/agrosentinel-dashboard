import { useState } from 'react';
import { SHARED_SHARE_URL, SHARED_STATS_URL } from '../../lib/constants';
import { makeT, type Lang } from '../../lib/translations';

interface RedTabProps {
  lang: Lang;
}

export default function RedTab({ lang }: RedTabProps) {
  const tr = makeT(lang);
  const [share, setShare] = useState(false);
  const [cuenca, setCuenca] = useState('');
  const [status, setStatus] = useState('');

  function shareToNetwork() {
    if (!share) {
      setStatus(tr('red.needCheck'));
      return;
    }
    if (!cuenca.trim()) {
      setStatus(tr('red.needCuenca'));
      return;
    }
    if (!SHARED_SHARE_URL) {
      setStatus(tr('red.notPublished'));
      return;
    }
  }

  function refreshNetwork() {
    if (!SHARED_STATS_URL) {
      setStatus(tr('red.notPublished'));
      return;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 p-5">
        <p className="text-sm text-white/50 mb-4">{tr('red.intro')}</p>

        <label className="flex items-center gap-2 text-sm text-white/70 mb-3 cursor-pointer">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="accent-[#7d2c44]" />
          {tr('red.share')}
        </label>

        {share && (
          <input
            type="text"
            value={cuenca}
            onChange={(e) => setCuenca(e.target.value)}
            placeholder={tr('red.cuencaPlaceholder')}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none mb-4"
          />
        )}

        <div className="flex gap-3">
          <button type="button" onClick={shareToNetwork} className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors">
            {tr('red.shareBtn')}
          </button>
          <button type="button" onClick={refreshNetwork} className="bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors">
            {tr('red.refreshBtn')}
          </button>
        </div>

        {status && <p className="text-xs text-white/40 mt-4">{status}</p>}
      </div>
    </div>
  );
}

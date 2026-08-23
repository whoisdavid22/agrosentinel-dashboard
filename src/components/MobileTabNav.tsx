import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { TABS, type TabId } from '../lib/tabs';
import { makeT, type Lang } from '../lib/translations';

interface MobileTabNavProps {
  lang: Lang;
  active: TabId;
  onSelect: (id: TabId) => void;
  labels: Record<TabId, string>;
}

export default function MobileTabNav({ lang, active, onSelect, labels }: MobileTabNavProps) {
  const tr = makeT(lang);
  const [open, setOpen] = useState(false);
  const activeTab = TABS.find((t) => t.id === active)!;
  const ActiveIcon = activeTab.icon;

  return (
    <div className="lg:hidden relative border-b border-white/5 bg-[#0d0d0f]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm text-white">
        <span className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-white/40">{tr('nav.section')}</span>
          <ActiveIcon size={14} />
          {labels[active]}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute left-0 right-0 top-full z-30 bg-[#141416] ring-1 ring-white/10 max-h-80 overflow-y-auto"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelect(tab.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left ${tab.id === active ? 'text-white bg-white/5' : 'text-white/60'}`}
                >
                  <Icon size={14} />
                  {labels[tab.id]}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

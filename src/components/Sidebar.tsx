import { motion } from 'framer-motion';
import { TABS, type TabId } from '../lib/tabs';
import Logo from './Logo';

interface SidebarProps {
  active: TabId;
  onSelect: (id: TabId) => void;
  labels: Record<TabId, string>;
}

export default function Sidebar({ active, onSelect, labels }: SidebarProps) {
  return (
    <nav className="hidden lg:flex flex-col w-56 shrink-0 bg-[#0d0d0f] border-r border-white/5 py-5">
      <div className="flex items-center gap-2 px-5 mb-6">
        <Logo className="w-5 h-5 text-white" />
        <span className="font-playfair italic text-lg text-white">AgroSentinel</span>
      </div>
      <div className="flex flex-col gap-0.5 px-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors text-left ${
                isActive ? 'text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 bg-[#7d2c44]/15 rounded-lg"
                />
              )}
              <Icon size={15} className="relative shrink-0" />
              <span className="relative truncate">{labels[tab.id]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

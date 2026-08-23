import { QrCode, FileDown, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TopBarProps {
  userEmail: string | null;
  apiStatus: 'idle' | 'ok' | 'error';
  apiStatusLabel: string;
  lang: 'es' | 'en';
  onToggleLang: () => void;
  onOpenQR: () => void;
  onExportPDF: () => void;
}

export default function TopBar({ userEmail, apiStatus, apiStatusLabel, lang, onToggleLang, onOpenQR, onExportPDF }: TopBarProps) {
  const dotColor = apiStatus === 'ok' ? '#268a4a' : apiStatus === 'error' ? '#b23a2c' : 'rgba(255,255,255,0.2)';

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/5 bg-[#0d0d0f]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0 transition-colors" style={{ background: dotColor }} />
        <span className="text-xs text-white/50 truncate">{apiStatusLabel}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleLang}
          className="text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-full transition-colors"
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
        <button type="button" onClick={onOpenQR} className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="Código QR">
          <QrCode size={16} />
        </button>
        <button type="button" onClick={onExportPDF} className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors" aria-label="Exportar PDF">
          <FileDown size={16} />
        </button>
        {userEmail && (
          <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-white/10">
            <span className="text-xs text-white/50 truncate max-w-[140px]">{userEmail}</span>
            <button type="button" onClick={logout} className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors" aria-label="Cerrar sesión">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import type { ChatMsg } from '../hooks/useDashboard';

interface CopilotProps {
  messages: ChatMsg[];
  loading: boolean;
  sendMessage: (text: string) => void;
}

const CHIPS = ['💧 ¿Debería regar hoy?', '🧮 ¿Qué es ET0?', '🤔 ¿Por qué esta decisión?'];

export default function Copilot({ messages, loading, sendMessage }: CopilotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  function submit() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-[#7d2c44] hover:bg-[#5e2033] text-white flex items-center justify-center shadow-lg shadow-black/30 transition-transform hover:scale-105"
        aria-label="Copiloto"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-[92vw] sm:w-80 max-h-[70vh] flex flex-col rounded-2xl bg-[#141416] ring-1 ring-white/10 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-medium text-white">Copiloto AgroSentinel</p>
            <p className="text-[11px] text-white/40">Pregunta sobre la decisión actual</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[160px]">
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => sendMessage(c.replace(/^\S+\s/, ''))}
                    className="text-[11px] bg-white/5 hover:bg-white/10 text-white/70 px-2.5 py-1.5 rounded-full transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] text-xs leading-relaxed px-3 py-2 rounded-xl ${
                  m.who === 'user' ? 'self-end bg-[#7d2c44] text-white' : 'self-start bg-white/5 text-white/80'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="self-start text-xs text-white/40 px-3 py-2">Pensando...</div>}
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-white/5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs text-white placeholder-white/30 outline-none"
            />
            <button type="button" onClick={submit} className="w-8 h-8 rounded-full bg-[#7d2c44] hover:bg-[#5e2033] text-white flex items-center justify-center shrink-0">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

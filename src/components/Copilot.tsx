import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import type { ChatMsg } from '../hooks/useDashboard';
import { makeT, type Lang } from '../lib/translations';

interface CopilotProps {
  lang: Lang;
  messages: ChatMsg[];
  loading: boolean;
  sendMessage: (text: string) => void;
}

export default function Copilot({ lang, messages, loading, sendMessage }: CopilotProps) {
  const tr = makeT(lang);
  const CHIPS = [tr('copilot.chip1'), tr('copilot.chip2'), tr('copilot.chip3')];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  function submit() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-[#7d2c44] hover:bg-[#5e2033] text-white flex items-center justify-center shadow-lg shadow-black/30"
        aria-label={tr('copilot.title')}
      >
        <motion.span
          key={open ? 'close' : 'open'}
          initial={{ opacity: 0, rotate: -45 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          {open ? <X size={20} /> : <MessageCircle size={20} />}
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 right-5 z-40 w-[92vw] sm:w-80 max-h-[70vh] flex flex-col rounded-2xl bg-[#141416] ring-1 ring-white/10 shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-white">{tr('copilot.title')}</p>
              <p className="text-[11px] text-white/40">{tr('copilot.subtitle')}</p>
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
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`max-w-[85%] text-xs leading-relaxed px-3 py-2 rounded-xl ${
                      m.who === 'user' ? 'self-end bg-[#7d2c44] text-white' : 'self-start bg-white/5 text-white/80'
                    }`}
                  >
                    {m.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && <div className="self-start text-xs text-white/40 px-3 py-2">{tr('copilot.thinking')}</div>}
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-white/5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={tr('copilot.placeholder')}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs text-white placeholder-white/30 outline-none"
              />
              <button type="button" onClick={submit} className="w-8 h-8 rounded-full bg-[#7d2c44] hover:bg-[#5e2033] text-white flex items-center justify-center shrink-0">
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

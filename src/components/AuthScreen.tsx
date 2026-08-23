import { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function attemptLogin() {
    if (!email.trim() || !password) {
      setStatus({ text: 'Ingresá tu correo y contraseña.', error: true });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setStatus({
          text: 'Cuenta creada. Si tu proyecto pide confirmación por correo, revísalo; si no, ya puedes iniciar sesión.',
          error: false,
        });
      }
    } catch (err) {
      setStatus({ text: (err as Error).message || 'Error de autenticación.', error: true });
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0d0d0f] px-5">
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(125,44,68,0.35), transparent 60%)' }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo className="w-6 h-6 text-white" />
          <span className="font-playfair italic text-2xl text-white">AgroSentinel</span>
        </div>

        <div className="liquid-glass rounded-2xl p-7 sm:p-8">
          <h1 className="font-garamond text-2xl text-white mb-1">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
          <p className="text-white/50 text-xs mb-6">Monitor de estrés hídrico — IA autónoma</p>

          <div className="flex flex-col gap-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              onKeyDown={(e) => e.key === 'Enter' && attemptLogin()}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {status && (
            <p className={`text-xs mb-4 ${status.error ? 'text-[#c0392b]' : 'text-[#268a4a]'}`}>{status.text}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={attemptLogin}
            className="w-full bg-[#7d2c44] hover:bg-[#5e2033] disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-full transition-colors mb-3"
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Registrarme'}
          </button>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 text-sm font-medium py-2.5 rounded-full hover:bg-gray-100 transition-colors mb-4"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="text-center text-xs text-white/50">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === 'login' ? 'register' : 'login'));
                setStatus(null);
              }}
              className="text-white underline underline-offset-2 hover:no-underline"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-white/30 text-[11px]">
          <Droplets size={12} />
          <span>San Carlos, Alajuela — Costa Rica</span>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 16.3 3 9.7 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.4 0 10.3-1.8 14.1-5.1l-6.5-5.5C29.5 36 26.9 37 24 37c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 40.6 16.3 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C41.6 35.6 45 30.3 45 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Apple, ChevronRight, Lock, Mail } from 'lucide-react';
import { registerWithEmail, signInWithEmail, signInWithGoogle } from '../services/authService';
import { AuthUser } from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

const FEATURES = [
  { emoji: '🌙', text: 'Трекер сна' },
  { emoji: '📖', text: 'Дневник роста' },
  { emoji: '🤖', text: 'AI помощник 24/7' },
  { emoji: '🍎', text: 'Питание малыша' },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const getLoginErrorMessage = (err: unknown) => {
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';

    switch (code) {
      case 'auth/unauthorized-domain':
        return 'Этот домен ещё не разрешён в Firebase Auth. Попробуй обновить страницу через минуту.';
      case 'auth/popup-closed-by-user':
        return 'Окно входа было закрыто до завершения. Попробуй ещё раз.';
      case 'auth/cancelled-popup-request':
        return 'Предыдущая попытка входа ещё не завершилась. Попробуй снова через пару секунд.';
      case 'auth/invalid-email':
        return 'Похоже, email введён с ошибкой.';
      case 'auth/missing-password':
        return 'Введи пароль.';
      case 'auth/weak-password':
        return 'Пароль слишком простой. Нужно минимум 6 символов.';
      case 'auth/email-already-in-use':
        return 'Этот email уже зарегистрирован. Попробуй просто войти.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Неверный email или пароль.';
      default:
        return 'Не удалось войти. Попробуй ещё раз.';
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim()) {
      setError('Введи email.');
      return;
    }

    if (!password) {
      setError('Введи пароль.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = mode === 'login'
        ? await signInWithEmail(email, password)
        : await registerWithEmail(email, password);
      onLogin(user);
    } catch (err: unknown) {
      console.error('Email auth error:', err);
      setError(getLoginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(getLoginErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#0f0c29_0%,#1f1a47_42%,#f7f3ed_100%)] px-4 pb-[max(24px,var(--safe-bottom))] pt-[max(18px,var(--safe-top))] text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute -left-12 top-1/3 h-52 w-52 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-8 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-42px)] w-full max-w-md items-center">
        <motion.div
          className="w-full rounded-[30px] border border-white/15 bg-white/10 p-5 shadow-[0_24px_80px_rgba(4,4,24,0.35)] backdrop-blur-2xl sm:p-6"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8faf,#8ab8ff)] text-4xl shadow-[0_16px_36px_rgba(138,184,255,0.35)]"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            👶
          </motion.div>

          <div className="text-center">
            <motion.h1
              className="text-[2rem] font-extrabold tracking-tight text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              LittleGuide
            </motion.h1>
            <motion.p
              className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-white/75"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              Помощник для родителей, который удобно открывать каждый день прямо с телефона.
            </motion.p>
          </div>

          <motion.div
            className="mt-5 grid grid-cols-2 gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.text}
                className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-left"
              >
                <div className="text-lg">{feature.emoji}</div>
                <p className="mt-1 text-xs font-semibold leading-snug text-white/80">{feature.text}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34 }}
          >
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70'}`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70'}`}
            >
              Регистрация
            </button>
          </motion.div>

          <motion.div
            className="mt-4 space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                <Mail size={14} />
                Email
              </span>
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-4 text-base text-white placeholder:text-white/35 focus:border-white/35 focus:bg-white/14 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                <Lock size={14} />
                Пароль
              </span>
              <input
                type="password"
                placeholder={mode === 'login' ? 'Пароль' : 'Минимум 6 символов'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-2xl border border-white/12 bg-white/10 px-4 py-4 text-base text-white placeholder:text-white/35 focus:border-white/35 focus:bg-white/14 focus:outline-none"
              />
            </label>

            <motion.button
              type="button"
              onClick={handleEmailAuth}
              disabled={isLoading}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#8fd694,#4aa3ff)] px-4 py-4 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(74,163,255,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {mode === 'login' ? 'Войти по email' : 'Создать аккаунт'}
                  <ChevronRight size={18} />
                </>
              )}
            </motion.button>
          </motion.div>

          <motion.div
            className="my-4 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.46 }}
          >
            <span className="h-px flex-1 bg-white/12" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">или</span>
            <span className="h-px flex-1 bg-white/12" />
          </motion.div>

          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white px-4 py-4 text-base font-bold text-slate-900 shadow-[0_12px_28px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            ) : (
              <>
                <GoogleIcon />
                Войти через Google
              </>
            )}
          </motion.button>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/70">
            <div className="mb-1 flex items-center gap-2 font-semibold text-white/80">
              <Apple size={16} />
              На iPhone удобнее пользоваться после установки на экран домой.
            </div>
            <p className="m-0 text-xs leading-relaxed text-white/60">
              После входа открой меню внутри приложения и там увидишь подсказку по установке.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-medium leading-relaxed text-red-100"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            className="mt-4 text-center text-xs leading-relaxed text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58 }}
          >
            Данные аккаунта сохраняются в облаке и будут доступны на других устройствах.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default LoginScreen;

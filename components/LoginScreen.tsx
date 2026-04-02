import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle } from '../services/authService';
import { onAuthChange, AuthUser } from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Не удалось войти. Попробуй ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo / Icon */}
        <motion.div
          style={styles.logoWrap}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          <span style={styles.logoEmoji}>👶</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          style={styles.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          LittleGuide
        </motion.h1>

        <motion.p
          style={styles.subtitle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          Твой умный помощник для первых лет жизни малыша
        </motion.p>

        {/* Features list */}
        <motion.div
          style={styles.features}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          {[
            { emoji: '🌙', text: 'Трекер сна' },
            { emoji: '📖', text: 'Дневник роста' },
            { emoji: '🤖', text: 'AI педиатр 24/7' },
            { emoji: '🍎', text: 'Дневник питания' },
          ].map((f) => (
            <div key={f.text} style={styles.featureItem}>
              <span style={styles.featureEmoji}>{f.emoji}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Google Sign In Button */}
        <motion.button
          style={{
            ...styles.googleBtn,
            ...(isLoading ? styles.googleBtnLoading : {}),
          }}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          {isLoading ? (
            <div style={styles.spinner} />
          ) : (
            <>
              <svg style={styles.googleIcon} viewBox="0 0 24 24">
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
              Войти через Google
            </>
          )}
        </motion.button>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              style={styles.error}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.p
          style={styles.fine}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          Все данные надёжно хранятся в облаке и синхронизируются между устройствами
        </motion.p>
      </motion.div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  blob1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,107,157,0.25) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
    animation: 'pulse 6s ease-in-out infinite',
  },
  blob2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(107,185,255,0.2) 0%, transparent 70%)',
    bottom: '-80px',
    left: '-80px',
    animation: 'pulse 8s ease-in-out infinite reverse',
  },
  blob3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,255,168,0.15) 0%, transparent 70%)',
    top: '40%',
    left: '10%',
    animation: 'pulse 7s ease-in-out infinite 2s',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 28,
    padding: '48px 40px',
    maxWidth: 420,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
    boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff6b9d, #c44dff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: '0 8px 32px rgba(196,77,255,0.4)',
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px',
    fontFamily: "'Inter', sans-serif",
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 28,
    lineHeight: 1.5,
    fontFamily: "'Inter', sans-serif",
  },
  features: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '10px 14px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
  },
  googleBtn: {
    width: '100%',
    padding: '15px 24px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.95)',
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    transition: 'background 0.2s',
    minHeight: 54,
  },
  googleBtnLoading: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  googleIcon: {
    width: 20,
    height: 20,
    flexShrink: 0,
  },
  spinner: {
    width: 22,
    height: 22,
    border: '3px solid rgba(26,26,46,0.2)',
    borderTop: '3px solid #1a1a2e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: "'Inter', sans-serif",
  },
  fine: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 1.5,
    fontFamily: "'Inter', sans-serif",
  },
};

export default LoginScreen;

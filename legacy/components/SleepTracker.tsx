import React, { useState, useEffect } from 'react';
import { Moon, Play, Square, Clock, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../types';
import { SleepingBabyIcon, AwakeBabyIcon } from './SleepIcons';

interface SleepTrackerProps {
  userState: UserState;
  onUpdateUserState: (newState: UserState) => void;
}

export const SleepTracker: React.FC<SleepTrackerProps> = ({ userState, onUpdateUserState }) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for the active sleep duration
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const sleepSessions = userState.sleepSessions || [];
  const activeSession = sleepSessions.find(s => s.endTime === null);

  const handleToggleSleep = () => {
    const now = new Date().toISOString();
    let newSessions = [...sleepSessions];

    if (activeSession) {
      // Stop sleep
      const startTime = new Date(activeSession.startTime);
      const endTime = new Date(now);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      newSessions = newSessions.map(s => 
        s.id === activeSession.id 
          ? { ...s, endTime: now, durationMinutes } 
          : s
      );
    } else {
      // Start sleep
      newSessions.push({
        id: Date.now().toString(),
        startTime: now,
        endTime: null,
        durationMinutes: 0
      });
    }

    onUpdateUserState({ ...userState, sleepSessions: newSessions });
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} ${t('hours_short', { defaultValue: 'г' })} ${m} ${t('minutes_short', { defaultValue: 'хв' })}`;
    return `${m} ${t('minutes_short', { defaultValue: 'хв' })}`;
  };

  const getActiveDuration = () => {
    if (!activeSession) return 0;
    const start = new Date(activeSession.startTime);
    return Math.round((currentTime.getTime() - start.getTime()) / 60000);
  };

  // Calculate today's total sleep
  const today = new Date().setHours(0, 0, 0, 0);
  const todaysTotalMinutes = sleepSessions.reduce((total, session) => {
    const sessionStart = new Date(session.startTime).setHours(0, 0, 0, 0);
    if (sessionStart === today && session.endTime !== null) {
      return total + session.durationMinutes;
    }
    return total;
  }, 0) + getActiveDuration();

  // Sort sessions for history (newest first, excluding active)
  const historySessions = sleepSessions
    .filter(s => s.endTime !== null)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="space-y-6 px-5 pt-6 pb-24 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
          <Moon size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-warm-900">{t('sleep_tracker', { defaultValue: 'Сон малюка' })}</h2>
          <p className="text-sm text-warm-500">{t('sleep_tracker_desc', { defaultValue: 'Відстежуйте режим сну' })}</p>
        </div>
      </div>

      {/* Main Action Card */}
      <div className={`rounded-[32px] p-6 text-center shadow-lg transition-all duration-500 sm:p-8 ${
        activeSession 
          ? 'bg-gradient-to-br from-indigo-900 to-slate-800 text-white' 
          : 'glass-card border border-white/60 text-warm-900'
      }`}>
        <div className="mb-6 flex h-32 items-center justify-center">
          <AnimatePresence mode="wait">
            {activeSession ? (
              <motion.div
                key="sleeping"
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                transition={{ duration: 0.5 }}
                className="w-32 h-32"
              >
                <SleepingBabyIcon />
              </motion.div>
            ) : (
              <motion.div
                key="awake"
                initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: -10 }}
                transition={{ duration: 0.5 }}
                className="w-32 h-32"
              >
                <AwakeBabyIcon />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="mb-6">
          <h3 className="mb-2 text-2xl font-extrabold">
            {activeSession 
              ? t('baby_is_sleeping', { defaultValue: 'Малюк спить' }) 
              : t('baby_is_awake', { defaultValue: 'Малюк не спить' })}
          </h3>
          
          {activeSession && (
            <div className="mb-2 text-4xl font-light font-mono text-indigo-200">
              {formatDuration(getActiveDuration())}
            </div>
          )}
        </div>

        <button
          onClick={handleToggleSleep}
          className={`flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[24px] py-4 text-base font-extrabold transition-transform active:scale-95 ${
            activeSession
              ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
          }`}
        >
          {activeSession ? (
            <>
              <Square size={20} fill="currentColor" />
              {t('wake_up', { defaultValue: 'Прокинувся' })}
            </>
          ) : (
            <>
              <Play size={20} fill="currentColor" />
              {t('fall_asleep', { defaultValue: 'Заснув' })}
            </>
          )}
        </button>
      </div>

      {/* Today's Summary */}
      <div className="glass-card flex items-center justify-between rounded-[28px] border border-white/60 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-warm-900">{t('total_sleep_today', { defaultValue: 'Сну за сьогодні' })}</p>
            <p className="text-xs text-warm-500">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-xl font-extrabold text-blue-600">
          {formatDuration(todaysTotalMinutes)}
        </div>
      </div>

      {/* History */}
      {historySessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-warm-900">
            <Calendar size={18} className="text-warm-500" />
            {t('sleep_history', { defaultValue: 'Історія сну' })}
          </h3>
          
          <div className="space-y-3">
            {historySessions.slice(0, 10).map(session => {
              const start = new Date(session.startTime);
              const end = new Date(session.endTime!);
              
              return (
                <div key={session.id} className="flex items-center justify-between rounded-[24px] border border-white/60 bg-white/70 p-4 backdrop-blur-sm">
                  <div>
                    <p className="text-sm font-bold text-warm-900">
                      {start.toLocaleDateString() === new Date().toLocaleDateString() 
                        ? t('today', { defaultValue: 'Сьогодні' }) 
                        : start.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-warm-500">
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">
                    {formatDuration(session.durationMinutes)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

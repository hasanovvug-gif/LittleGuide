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
    <div className="px-6 pt-8 pb-24 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
          <Moon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-warm-900">{t('sleep_tracker', { defaultValue: 'Сон малюка' })}</h2>
          <p className="text-sm text-warm-500">{t('sleep_tracker_desc', { defaultValue: 'Відстежуйте режим сну' })}</p>
        </div>
      </div>

      {/* Main Action Card */}
      <div className={`rounded-3xl p-8 text-center shadow-lg transition-all duration-500 ${
        activeSession 
          ? 'bg-gradient-to-br from-indigo-900 to-slate-800 text-white' 
          : 'bg-white border border-warm-200 text-warm-900'
      }`}>
        <div className="mb-6 h-32 flex items-center justify-center">
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
          <h3 className="text-xl font-bold mb-2">
            {activeSession 
              ? t('baby_is_sleeping', { defaultValue: 'Малюк спить' }) 
              : t('baby_is_awake', { defaultValue: 'Малюк не спить' })}
          </h3>
          
          {activeSession && (
            <div className="text-4xl font-light font-mono mb-2 text-indigo-200">
              {formatDuration(getActiveDuration())}
            </div>
          )}
        </div>

        <button
          onClick={handleToggleSleep}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 ${
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
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-900">{t('total_sleep_today', { defaultValue: 'Сну за сьогодні' })}</p>
            <p className="text-xs text-warm-500">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-xl font-bold text-blue-600">
          {formatDuration(todaysTotalMinutes)}
        </div>
      </div>

      {/* History */}
      {historySessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-warm-900 flex items-center gap-2">
            <Calendar size={18} className="text-warm-500" />
            {t('sleep_history', { defaultValue: 'Історія сну' })}
          </h3>
          
          <div className="space-y-3">
            {historySessions.slice(0, 10).map(session => {
              const start = new Date(session.startTime);
              const end = new Date(session.endTime!);
              
              return (
                <div key={session.id} className="bg-white/50 backdrop-blur-sm border border-warm-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-warm-900">
                      {start.toLocaleDateString() === new Date().toLocaleDateString() 
                        ? t('today', { defaultValue: 'Сьогодні' }) 
                        : start.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-warm-500">
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-medium">
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

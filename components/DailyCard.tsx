import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Brain, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { DailyActivity, BrainFact, UserState } from '../types';
import { useTranslation } from 'react-i18next';

interface DailyCardProps {
  activity: DailyActivity;
  brainFact: BrainFact;
  userState: UserState;
  onComplete: () => void;
  onRefreshActivity: () => void;
  loading?: boolean;
}

export const DailyCard: React.FC<DailyCardProps> = ({ 
  activity, 
  brainFact, 
  userState,
  onComplete, 
  onRefreshActivity,
  loading 
}) => {
  const { t } = useTranslation();

  // Calculate life days
  const birthDate = new Date(userState.childBirthDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return (
    <div className="space-y-6 px-5 pt-6 sm:px-6">
      {/* Header */}
      <div className="mb-2 flex items-end justify-between gap-4">
        <div className="min-w-0">
            <div className="mb-1 text-[11px] font-black uppercase tracking-[0.24em] text-warm-400">LittleGuide</div>
            <h2 className="text-[2rem] font-extrabold tracking-tight text-warm-900">{t('good_morning')}</h2>
            <p className="truncate text-[1.75rem] font-extrabold leading-none text-primary-600">{userState.parentName}</p>
        </div>
        <div className="text-right">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-warm-400">{t('to_baby')} {userState.childName}</p>
            <span className="rounded-full bg-warm-200/60 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-warm-700">
                {t('day')} {diffDays}
            </span>
        </div>
      </div>

      {/* Main Activity Card */}
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className={`relative overflow-hidden rounded-[32px] border border-white/60 p-5 shadow-xl shadow-warm-200/30 transition-all duration-500 sm:p-6 ${activity.isCompleted ? 'bg-primary-50/80' : 'glass-card'}`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_34%)]" />
          
          {/* Top meta tags */}
          <div className="relative z-10 mb-5 flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-warm-100 px-3 py-1.5 text-xs font-extrabold text-warm-700">
                    {activity.category === 'Cognitive' ? t('cat_logic') : 
                     activity.category === 'Motor' ? t('cat_motor') : 
                     activity.category === 'Sensory' ? t('cat_sensory') : t('cat_communication')}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-warm-100 px-3 py-1.5 text-xs font-bold text-warm-600">
                    <Clock size={12} /> {activity.duration}
                </span>
            </div>
            {!activity.isCompleted && (
                 <button 
                 onClick={onRefreshActivity} 
                 disabled={loading}
                 className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-warm-400 shadow-sm transition-colors hover:text-primary-500 ${loading ? 'animate-spin' : ''}`}
               >
                 <RefreshCw size={18} />
               </button>
            )}
          </div>

          <div className="relative z-10">
          <h3 className="mb-3 pr-2 text-2xl font-extrabold leading-tight text-warm-900">
            {activity.title}
          </h3>
          <p className="mb-6 text-[15px] leading-relaxed text-warm-800">
            {activity.description}
          </p>
          </div>

          <motion.button
            whileTap={!activity.isCompleted ? { scale: 0.95 } : {}}
            onClick={onComplete}
            disabled={activity.isCompleted}
            className={`relative z-10 flex min-h-[56px] w-full items-center justify-center gap-2 overflow-hidden rounded-[22px] px-4 py-4 text-base font-extrabold transition-all duration-300 ${
              activity.isCompleted
                ? 'bg-primary-100 text-primary-700 cursor-default'
                : 'bg-warm-900 text-white hover:bg-warm-800 shadow-lg shadow-warm-900/20'
            }`}
          >
            <AnimatePresence mode="wait">
              {activity.isCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check size={20} /> {t('completed')}
                </motion.div>
              ) : (
                <motion.span key="incomplete">
                  {t('mark_completed')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* Brain Fact Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,rgba(238,242,255,0.9),rgba(255,255,255,0.88))] p-5 shadow-sm"
      >
        <Brain className="absolute -right-4 -bottom-4 text-indigo-100 w-32 h-32 opacity-50 transform rotate-12" />
        <div className="relative z-10 flex gap-4">
            <div className="h-min rounded-[20px] bg-white/85 p-3 shadow-sm text-indigo-500">
                <Sparkles size={24} />
            </div>
            <div>
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-indigo-400">Brain Fact</div>
                <h4 className="mb-1 text-lg font-extrabold text-indigo-900">{brainFact.title}</h4>
                <p className="text-sm leading-snug text-indigo-800/80">
                    {brainFact.fact}
                </p>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

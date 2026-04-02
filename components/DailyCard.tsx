import React, { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

  // Calculate life days
  const birthDate = new Date(userState.childBirthDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return (
    <div className="space-y-6 px-6 pt-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
            <h2 className="text-3xl font-bold text-warm-900 tracking-tight">{t('good_morning')}</h2>
            <p className="text-2xl font-bold text-primary-600">{userState.parentName}</p>
        </div>
        <div className="text-right">
            <p className="text-warm-400 text-[10px] uppercase font-bold tracking-wider mb-1">{t('to_baby')} {userState.childName}</p>
            <span className="text-xs font-bold text-warm-600 bg-warm-200/50 px-3 py-1 rounded-full uppercase tracking-wider">
                {t('day')} {diffDays}
            </span>
        </div>
      </div>

      {/* Main Activity Card */}
      <motion.div 
        className="relative group perspective"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className={`bg-white/70 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-warm-200/30 border border-white/50 transition-all duration-500 ${activity.isCompleted ? 'bg-primary-50/70 border-primary-100/50' : ''}`}>
          
          {/* Top meta tags */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2">
                <span className="px-3 py-1 bg-warm-100 text-warm-600 text-xs rounded-full font-semibold">
                    {activity.category === 'Cognitive' ? t('cat_logic') : 
                     activity.category === 'Motor' ? t('cat_motor') : 
                     activity.category === 'Sensory' ? t('cat_sensory') : t('cat_communication')}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-warm-100 text-warm-600 text-xs rounded-full">
                    <Clock size={12} /> {activity.duration}
                </span>
            </div>
            {!activity.isCompleted && (
                 <button 
                 onClick={onRefreshActivity} 
                 disabled={loading}
                 className={`text-warm-300 hover:text-primary-500 transition-colors ${loading ? 'animate-spin' : ''}`}
               >
                 <RefreshCw size={18} />
               </button>
            )}
          </div>

          <h3 className="text-xl font-bold text-warm-900 mb-3 pr-8">
            {activity.title}
          </h3>
          <p className="text-warm-800 leading-relaxed text-sm mb-6">
            {activity.description}
          </p>

          <motion.button
            whileTap={!activity.isCompleted ? { scale: 0.95 } : {}}
            onClick={onComplete}
            disabled={activity.isCompleted}
            className={`relative overflow-hidden w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 ${
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
        className="bg-gradient-to-br from-indigo-50/70 to-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm relative overflow-hidden"
      >
        <Brain className="absolute -right-4 -bottom-4 text-indigo-100 w-32 h-32 opacity-50 transform rotate-12" />
        <div className="relative z-10 flex gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-full h-min shadow-sm text-indigo-500">
                <Sparkles size={24} />
            </div>
            <div>
                <h4 className="font-bold text-indigo-900 text-lg mb-1">{brainFact.title}</h4>
                <p className="text-indigo-800/80 text-sm leading-snug">
                    {brainFact.fact}
                </p>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
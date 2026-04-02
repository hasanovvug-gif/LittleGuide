import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Quest, UserState } from '../types';
import { Trophy, Star, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateQuest } from '../services/geminiService';
import { INITIAL_QUESTS } from '../constants';

interface QuestsProps {
  userState: UserState;
  onUpdateUserState: (newState: UserState) => void;
}

export const Quests: React.FC<QuestsProps> = ({ userState, onUpdateUserState }) => {
  const { t, i18n } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  const activeQuests = userState.activeQuests && userState.activeQuests.length > 0 
    ? userState.activeQuests 
    : INITIAL_QUESTS;

  const handleCompleteTask = (questId: string) => {
    const updatedQuests = activeQuests.map(q => {
      if (q.id === questId && !q.isCompletedToday) {
        return {
          ...q,
          currentDay: Math.min(q.currentDay + 1, q.totalDays),
          isCompletedToday: true
        };
      }
      return q;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const newState = {
      ...userState,
      activeQuests: updatedQuests
    };

    if (userState.lastActiveDate !== todayStr) {
      newState.streakCount = (userState.streakCount || 0) + 1;
      newState.lastActiveDate = todayStr;
    }

    onUpdateUserState(newState);
  };

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    try {
      // Calculate age
      const birthDate = new Date(userState.childBirthDate);
      const today = new Date();
      let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
      ageMonths -= birthDate.getMonth();
      ageMonths += today.getMonth();
      if (today.getDate() < birthDate.getDate()) ageMonths--;
      ageMonths = Math.max(0, ageMonths);

      const newQuestData = await generateQuest(ageMonths, userState.childName, i18n.language);
      
      const newQuest: Quest = {
        id: `q_${Date.now()}`,
        currentDay: 0,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        isCompletedToday: false,
        ...newQuestData
      };

      onUpdateUserState({
        ...userState,
        activeQuests: [newQuest, ...activeQuests]
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="px-6 pt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-warm-900">{t('challenges')}</h2>
        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-yellow-700 text-xs font-bold">
            <Trophy size={14} />
            <span>{t('level', { level: 3 })}</span>
        </div>
      </div>

      <motion.div 
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {activeQuests.map((quest) => (
          <motion.div 
            key={quest.id} 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
                <div className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${quest.color || 'bg-blue-100 text-blue-700'}`}>
                    {t('current')}
                </div>
                <span className="text-xs text-warm-400 font-medium">
                    {t('days_progress', { current: quest.currentDay, total: quest.totalDays })}
                </span>
            </div>
            
            <h3 className="text-lg font-bold text-warm-900 mb-1">
              {quest.id.startsWith('q_') ? quest.title : t(`${quest.id}_title`)}
            </h3>
            <p className="text-sm text-warm-500 mb-4">
              {quest.id.startsWith('q_') ? quest.description : t(`${quest.id}_desc`)}
            </p>

            {(quest.tasks || quest.dailyTask) && (
              <div className="bg-warm-50 p-3 rounded-xl mb-4 border border-warm-100">
                <p className="text-sm font-medium text-warm-800">
                  <span className="font-bold mr-1">🎯 {t('task_for_today')}</span> 
                  {quest.tasks && quest.tasks.length > 0 ? quest.tasks[Math.min(quest.currentDay, quest.tasks.length - 1)] : quest.dailyTask}
                </p>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-warm-100 rounded-full overflow-hidden mb-4">
                <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(quest.currentDay / quest.totalDays) * 100}%` }}
                />
            </div>

            <button 
              onClick={() => handleCompleteTask(quest.id)}
              disabled={quest.isCompletedToday || quest.currentDay >= quest.totalDays}
              className={`w-full py-2 border rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                quest.isCompletedToday || quest.currentDay >= quest.totalDays
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'border-warm-200 text-warm-700 hover:bg-warm-50'
              }`}
            >
                {quest.isCompletedToday || quest.currentDay >= quest.totalDays ? (
                  <><Check size={16} /> {t('completed')}</>
                ) : (
                  <><>{t('mark_completed')} <ChevronRight size={16} /></></>
                )}
            </button>
          </motion.div>
        ))}

        <motion.div 
             variants={{
               hidden: { opacity: 0, scale: 0.9 },
               visible: { opacity: 1, scale: 1 }
             }}
             className="bg-gradient-to-r from-purple-500/90 to-indigo-600/90 backdrop-blur-md rounded-2xl p-6 text-white relative overflow-hidden mt-6 border border-white/20 shadow-lg"
        >
             <Star className="absolute -top-4 -right-4 w-24 h-24 text-white opacity-20 rotate-12" />
             <h3 className="text-lg font-bold mb-2 relative z-10">{t('new_challenge')}</h3>
             <p className="text-purple-100 text-sm mb-4 relative z-10 w-3/4">
                {t('ready_to_try')}
             </p>
             <button 
                onClick={handleGenerateNew}
                disabled={isGenerating}
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors relative z-10 flex items-center gap-2 disabled:opacity-50"
             >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : null}
                {isGenerating ? t('generating') : t('generate_challenge')}
             </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
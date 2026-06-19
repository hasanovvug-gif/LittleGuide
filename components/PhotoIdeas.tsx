import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Sparkles, Sun, Image as ImageIcon, ChevronRight, CheckCircle2 } from 'lucide-react';
import { UserState } from '../types';
import { generatePhotoIdeas, PhotoIdea } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

interface PhotoIdeasProps {
  userState: UserState;
}

export const PhotoIdeas: React.FC<PhotoIdeasProps> = ({ userState }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ai' | 'tips'>('ai');
  const [generatedIdea, setGeneratedIdea] = useState<PhotoIdea | null>(null);
  const [loading, setLoading] = useState(false);

  const STATIC_IDEAS = [
    {
      title: t('idea_flatlay_title'),
      desc: t('idea_flatlay_desc'),
      difficulty: t('difficulty_easy')
    },
    {
      title: t('idea_macro_title'),
      desc: t('idea_macro_desc'),
      difficulty: t('difficulty_medium')
    },
    {
      title: t('idea_reflection_title'),
      desc: t('idea_reflection_desc'),
      difficulty: t('difficulty_hard')
    }
  ];

  // Calculate age
  const birthDate = new Date(userState.childBirthDate);
  const today = new Date();
  let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
  ageMonths -= birthDate.getMonth();
  ageMonths += today.getMonth();
  if (today.getDate() < birthDate.getDate()) ageMonths--;
  ageMonths = Math.max(0, ageMonths);

  const handleGenerate = async () => {
    setLoading(true);
    const idea = await generatePhotoIdeas(ageMonths, userState.childName, i18n.language);
    setGeneratedIdea(idea);
    setLoading(false);
  };

  return (
    <div className="min-h-full bg-warm-50 px-5 pb-20 pt-6 text-warm-900 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 shadow-sm">
            <Camera size={24} />
        </div>
        <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-warm-900">{t('photo_studio')}</h2>
            <p className="text-sm text-warm-500">{t('save_moments')}</p>
        </div>
      </div>

      <div className="mb-6 flex rounded-[22px] border border-white/50 bg-white/60 p-1.5 shadow-sm backdrop-blur-md">
        <button 
            onClick={() => setActiveTab('ai')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] py-3 text-sm font-extrabold transition-all ${activeTab === 'ai' ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-warm-400'}`}
        >
            <Sparkles size={14} />
            {t('creative')}
        </button>
        <button 
            onClick={() => setActiveTab('tips')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[18px] py-3 text-sm font-extrabold transition-all ${activeTab === 'tips' ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-warm-400'}`}
        >
            <Sun size={14} />
            {t('idea_base')}
        </button>
      </div>

      {activeTab === 'ai' && (
        <div className="space-y-6">
             <div className="relative overflow-hidden rounded-[30px] border border-white/20 bg-gradient-to-br from-rose-400/90 to-rose-600/90 p-6 text-white shadow-lg shadow-rose-200 backdrop-blur-md">
                <ImageIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 rotate-12" />
                <h3 className="relative z-10 mb-2 text-xl font-extrabold">{t('ai_photographer')}</h3>
                <p className="relative z-10 mb-4 text-sm leading-relaxed text-rose-100">
                    {t('ai_photo_desc', { name: userState.childName, age: ageMonths })}
                </p>
                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="relative z-10 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[22px] bg-white py-3 text-base font-extrabold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-70"
                >
                    {loading ? t('generating') : t('generate_idea')}
                </button>
             </div>

             {generatedIdea && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[28px] border border-white/60 bg-white/78 p-6 shadow-sm backdrop-blur-md">
                    <h3 className="mb-2 text-2xl font-extrabold text-warm-900">{generatedIdea.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-warm-600">{generatedIdea.concept}</p>
                    
                    <div className="mb-4">
                        <h4 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-warm-400">{t('props')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {generatedIdea.props.map((prop, i) => (
                                <span key={i} className="rounded-full bg-warm-100 px-3 py-1.5 text-xs font-bold text-warm-600">
                                    {prop}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 rounded-[22px] border border-yellow-100/50 bg-yellow-50/70 p-4 backdrop-blur-sm">
                        <Sun className="text-yellow-500 shrink-0" size={20} />
                        <p className="text-sm font-medium text-yellow-800">{generatedIdea.tips}</p>
                    </div>
                 </div>
             )}
        </div>
      )}

      {activeTab === 'tips' && (
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
            <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-lg font-extrabold text-warm-900">{t('perfect_shot_checklist')}</motion.h3>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur-md">
                <div className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-warm-700">{t('checklist_1')}</p>
                </div>
                <div className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-warm-700">{t('checklist_2')}</p>
                </div>
                <div className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-warm-700">{t('checklist_3')}</p>
                </div>
                <div className="flex gap-3">
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-warm-700">{t('checklist_4')}</p>
                </div>
            </motion.div>

            <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="mt-6 text-lg font-extrabold text-warm-900">{t('simple_ideas')}</motion.h3>
            {STATIC_IDEAS.map((idea, idx) => (
                <motion.div 
                    key={idx} 
                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex cursor-pointer items-center justify-between rounded-[24px] border border-white/60 bg-white/75 p-4 shadow-sm transition-colors backdrop-blur-md"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-extrabold text-warm-800">{idea.title}</h4>
                            <span className="rounded-md bg-warm-100 px-2 py-0.5 text-[10px] font-bold text-warm-500">{idea.difficulty}</span>
                        </div>
                        <p className="max-w-[240px] text-sm leading-snug text-warm-500">{idea.desc}</p>
                    </div>
                    <ChevronRight size={20} className="text-warm-300" />
                </motion.div>
            ))}
          </motion.div>
      )}
    </div>
  );
};

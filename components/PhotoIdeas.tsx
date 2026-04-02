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
    <div className="min-h-full bg-warm-50 text-warm-900 p-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-rose-100 p-2 rounded-full text-rose-500">
            <Camera size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-warm-900">{t('photo_studio')}</h2>
            <p className="text-xs text-warm-500">{t('save_moments')}</p>
        </div>
      </div>

      <div className="flex p-1 bg-white/60 backdrop-blur-md rounded-xl mb-6 shadow-sm border border-white/50">
        <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-rose-50 text-rose-600' : 'text-warm-400'}`}
        >
            <Sparkles size={14} />
            {t('creative')}
        </button>
        <button 
            onClick={() => setActiveTab('tips')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'tips' ? 'bg-rose-50 text-rose-600' : 'text-warm-400'}`}
        >
            <Sun size={14} />
            {t('idea_base')}
        </button>
      </div>

      {activeTab === 'ai' && (
        <div className="space-y-6">
             <div className="bg-gradient-to-br from-rose-400/90 to-rose-600/90 backdrop-blur-md rounded-3xl p-6 text-white shadow-lg shadow-rose-200 relative overflow-hidden border border-white/20">
                <ImageIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 rotate-12" />
                <h3 className="font-bold text-lg mb-2 relative z-10">{t('ai_photographer')}</h3>
                <p className="text-rose-100 text-sm mb-4 relative z-10">
                    {t('ai_photo_desc', { name: userState.childName, age: ageMonths })}
                </p>
                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-white text-rose-600 py-3 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 relative z-10"
                >
                    {loading ? t('generating') : t('generate_idea')}
                </button>
             </div>

             {generatedIdea && (
                 <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold text-warm-900 mb-2">{generatedIdea.title}</h3>
                    <p className="text-warm-600 text-sm leading-relaxed mb-4">{generatedIdea.concept}</p>
                    
                    <div className="mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">{t('props')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {generatedIdea.props.map((prop, i) => (
                                <span key={i} className="px-3 py-1 bg-warm-100 text-warm-600 text-xs rounded-full">
                                    {prop}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-yellow-50/70 backdrop-blur-sm p-4 rounded-xl border border-yellow-100/50 flex gap-3">
                        <Sun className="text-yellow-500 shrink-0" size={20} />
                        <p className="text-xs text-yellow-800 font-medium">{generatedIdea.tips}</p>
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
            <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="font-bold text-warm-900 text-lg">{t('perfect_shot_checklist')}</motion.h3>
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm space-y-3">
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

            <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="font-bold text-warm-900 text-lg mt-6">{t('simple_ideas')}</motion.h3>
            {STATIC_IDEAS.map((idea, idx) => (
                <motion.div 
                    key={idx} 
                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm flex justify-between items-center group cursor-pointer transition-colors"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-warm-800">{idea.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-warm-100 rounded text-warm-500">{idea.difficulty}</span>
                        </div>
                        <p className="text-xs text-warm-500 leading-snug max-w-[240px]">{idea.desc}</p>
                    </div>
                    <ChevronRight size={20} className="text-warm-300" />
                </motion.div>
            ))}
          </motion.div>
      )}
    </div>
  );
};
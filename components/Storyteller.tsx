import React, { useState } from 'react';
import { Moon, Sparkles, BookOpen, Image as ImageIcon } from 'lucide-react';
import { generateBedtimeStory, generateStoryImage } from '../services/geminiService';
import { UserState } from '../types';
import { useTranslation } from 'react-i18next';

interface StorytellerProps {
    userState: UserState;
}

export const Storyteller: React.FC<StorytellerProps> = ({ userState }) => {
  const { t, i18n } = useTranslation();
  const [context, setContext] = useState('');
  const [story, setStory] = useState('');
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleGenerate = async () => {
    if (!context.trim()) return;
    setLoading(true);
    setStoryImage(null);
    
    try {
      const result = await generateBedtimeStory(context, userState.childName, i18n.language);
      setStory(result);
      
      // Generate image in parallel or right after
      setLoadingImage(true);
      generateStoryImage(result).then(img => {
        setStoryImage(img);
        setLoadingImage(false);
      }).catch(err => {
        console.error(err);
        setLoadingImage(false);
      });
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-900/60 px-5 pb-20 pt-6 text-slate-100 backdrop-blur-xl sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20">
            <Moon className="text-indigo-300" size={24} />
        </div>
        <div>
            <h2 className="text-3xl font-serif font-bold text-indigo-100">{t('storyteller')}</h2>
            <p className="text-sm text-indigo-400">{t('magic_before_sleep', { name: userState.childName })}</p>
        </div>
      </div>

      {!story ? (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-700/50 bg-slate-800/40 p-6 shadow-lg backdrop-blur-md">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    {t('what_happened_today')}
                </label>
                <textarea 
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={t('story_placeholder')}
                    className="h-36 w-full resize-none rounded-[22px] border border-slate-700 bg-slate-900/50 p-4 text-[15px] text-slate-100 placeholder:text-slate-600 transition-colors focus:border-indigo-500 focus:outline-none"
                />
            </div>
            
            <button 
                onClick={handleGenerate}
                disabled={loading || !context.trim()}
                className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-base font-extrabold shadow-lg shadow-indigo-900/50 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? (
                    <Sparkles className="animate-spin" />
                ) : (
                    <>
                        <Sparkles size={18} />
                        {t('compose_story')}
                    </>
                )}
            </button>
            
             <p className="text-sm text-center text-slate-500">
                {t('ai_story_desc', { name: userState.childName })}
            </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative overflow-hidden rounded-[30px] border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-md">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <BookOpen size={120} />
                </div>
                <div className="relative z-10">
                    {loadingImage ? (
                      <div className="mb-6 flex h-48 w-full animate-pulse flex-col items-center justify-center rounded-[22px] border border-slate-600/50 bg-slate-700/50">
                        <ImageIcon className="text-slate-400 mb-2 animate-bounce" size={32} />
                        <span className="text-xs text-slate-400">{t('drawing_illustration', { defaultValue: 'Малюємо ілюстрацію...' })}</span>
                      </div>
                    ) : storyImage ? (
                      <div className="mb-6 w-full overflow-hidden rounded-[22px] border border-slate-600/50 shadow-lg">
                        <img src={storyImage} alt="Story illustration" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : null}

                    <h3 className="mb-4 text-center text-2xl font-serif text-indigo-200">{t('story_of_today')}</h3>
                    <div className="prose prose-invert prose-sm leading-loose text-slate-300">
                        {story.split('\n').map((para, i) => (
                            <p key={i} className="mb-4">{para}</p>
                        ))}
                    </div>
                </div>
            </div>
            <button 
                onClick={() => { setStory(''); setStoryImage(null); }}
                className="mt-6 w-full rounded-[22px] py-3 text-sm font-bold text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
                {t('create_new_story')}
            </button>
        </div>
      )}
    </div>
  );
};

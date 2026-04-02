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
    <div className="min-h-full bg-slate-900/60 backdrop-blur-xl text-slate-100 p-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-500/20 p-2 rounded-full">
            <Moon className="text-indigo-300" size={24} />
        </div>
        <div>
            <h2 className="text-3xl font-serif font-bold text-indigo-100">{t('storyteller')}</h2>
            <p className="text-xs text-indigo-400">{t('magic_before_sleep', { name: userState.childName })}</p>
        </div>
      </div>

      {!story ? (
        <div className="space-y-6">
            <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    {t('what_happened_today')}
                </label>
                <textarea 
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={t('story_placeholder')}
                    className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
            </div>
            
            <button 
                onClick={handleGenerate}
                disabled={loading || !context.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
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
            
             <p className="text-xs text-center text-slate-500">
                {t('ai_story_desc', { name: userState.childName })}
            </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BookOpen size={120} />
                </div>
                <div className="relative z-10">
                    {loadingImage ? (
                      <div className="w-full h-48 bg-slate-700/50 rounded-xl mb-6 flex flex-col items-center justify-center border border-slate-600/50 animate-pulse">
                        <ImageIcon className="text-slate-400 mb-2 animate-bounce" size={32} />
                        <span className="text-xs text-slate-400">{t('drawing_illustration', { defaultValue: 'Малюємо ілюстрацію...' })}</span>
                      </div>
                    ) : storyImage ? (
                      <div className="w-full mb-6 rounded-xl overflow-hidden border border-slate-600/50 shadow-lg">
                        <img src={storyImage} alt="Story illustration" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : null}

                    <h3 className="text-xl font-serif text-indigo-200 mb-4 text-center">{t('story_of_today')}</h3>
                    <div className="prose prose-invert prose-sm leading-loose text-slate-300">
                        {story.split('\n').map((para, i) => (
                            <p key={i} className="mb-4">{para}</p>
                        ))}
                    </div>
                </div>
            </div>
            <button 
                onClick={() => { setStory(''); setStoryImage(null); }}
                className="mt-6 w-full py-3 text-slate-400 text-sm hover:text-white transition-colors"
            >
                {t('create_new_story')}
            </button>
        </div>
      )}
    </div>
  );
};
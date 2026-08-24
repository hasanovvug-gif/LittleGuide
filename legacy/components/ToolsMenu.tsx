import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Moon, CloudLightning, ChevronRight, Puzzle, Send, Sparkles, Camera, Wand2, Settings2, CheckCircle2, Utensils, BookHeart, MessageCircleHeart, Heart, Globe, Palette, LogOut, Share, Download, X } from 'lucide-react';
import { UserState } from '../types';
import { useTranslation } from 'react-i18next';

interface ToolsMenuProps {
  onNavigate: (view: string) => void;
  userState: UserState;
  onUpdateNav: (items: string[]) => void;
  onSignOut?: () => void;
  userEmail?: string;
}

type InstallPromptEvent = Event & {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const ToolsMenu: React.FC<ToolsMenuProps> = ({ onNavigate, userState, onUpdateNav, onSignOut, userEmail }) => {
  const { t, i18n } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [isIosInstallFlow, setIsIosInstallFlow] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    const dismissed = window.localStorage.getItem('little-guide-install-dismissed') === '1';

    if (standalone || dismissed) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

    if (isIos && isSafari) {
      setIsIosInstallFlow(true);
      setShowInstallCard(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setShowInstallCard(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const tools = [
    {
      id: 'sleep',
      title: t('sleep_tracker', { defaultValue: 'Сон малюка' }),
      desc: t('sleep_tracker_desc', { defaultValue: 'Відстежуйте режим сну' }),
      icon: Moon,
      color: 'bg-indigo-100 text-indigo-600',
      bg: 'hover:bg-indigo-50'
    },
    {
      id: 'art-studio',
      title: t('art_studio', { defaultValue: 'Арт-студія' }),
      desc: t('art_studio_desc', { defaultValue: 'Магія малювання з ШІ' }),
      icon: Palette,
      color: 'bg-pink-100 text-pink-600',
      bg: 'hover:bg-pink-50'
    },
    {
      id: 'magic-photo',
      title: t('magic_photo'),
      desc: t('magic_photo_desc'),
      icon: Wand2,
      color: 'bg-violet-100 text-violet-600',
      bg: 'hover:bg-violet-50'
    },
    {
      id: 'photo-ideas',
      title: t('photo_ideas'),
      desc: t('photo_ideas_desc'),
      icon: Camera,
      color: 'bg-rose-100 text-rose-600',
      bg: 'hover:bg-rose-50'
    },
    {
      id: 'storyteller',
      title: t('storyteller'),
      desc: t('storyteller_desc'),
      icon: BookHeart,
      color: 'bg-indigo-100 text-indigo-600',
      bg: 'hover:bg-indigo-50'
    },
    {
      id: 'leaps',
      title: t('leaps'),
      desc: t('leaps_desc'),
      icon: CloudLightning,
      color: 'bg-blue-100 text-blue-600',
      bg: 'hover:bg-blue-50'
    },
    {
      id: 'quests',
      title: t('quests'),
      desc: t('quests_desc'),
      icon: Trophy,
      color: 'bg-amber-100 text-amber-600',
      bg: 'hover:bg-amber-50'
    },
  ];

  // All pinnable items with consistent icons
  const allPinnable = [
    ...tools,
    { id: 'food', title: t('food'), desc: t('food_desc'), icon: Utensils, color: 'bg-green-100 text-green-600' },
    {
      id: 'diary', 
      title: t('diary'), 
      desc: t('diary_desc'), 
      icon: BookHeart, 
      color: 'bg-primary-100 text-primary-600' 
    },
    { id: 'chat', title: t('chat'), desc: t('chat_desc'), icon: MessageCircleHeart, color: 'bg-blue-100 text-blue-600' },
  ];

  const togglePin = (id: string) => {
    const current = [...(userState.customNavItems || [])];
    if (current.includes(id)) {
      onUpdateNav(current.filter(i => i !== id));
    } else if (current.length < 3) {
      onUpdateNav([...current, id]);
    } else {
      // Replace the last one if we have 3
      onUpdateNav([current[1], current[2], id]);
    }
  };

  const handleSend = () => {
    if (!feedback.trim()) return;
    
    // Fallback for feedback submission using mailto since Firebase setup failed
    const subject = encodeURIComponent('Идея для приложения');
    const body = encodeURIComponent(feedback);
    window.location.href = `mailto:hasanov.vug@gmail.com?subject=${subject}&body=${body}`;
    
    setIsSent(true);
    setFeedback('');
    setTimeout(() => setIsSent(false), 3000);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const dismissInstallCard = () => {
    window.localStorage.setItem('little-guide-install-dismissed', '1');
    setShowInstallCard(false);
  };

  const handleInstall = async () => {
    if (!installPrompt?.prompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallCard(false);
  };

  return (
    <div className="px-5 pt-6 pb-20 sm:px-6 sm:pt-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-warm-900">{t('tools')}</h2>
          <p className="mt-1 text-sm text-warm-500">Сделай приложение удобнее и открой нужные разделы в один тап.</p>
        </div>
        <button 
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`shrink-0 rounded-2xl px-3 py-3 text-xs font-bold transition-all flex items-center gap-2 ${isCustomizing ? 'bg-primary-500 text-white shadow-lg' : 'bg-warm-100 text-warm-500'}`}
        >
            <Settings2 size={18} />
            {isCustomizing ? t('done') : t('customize_menu')}
        </button>
      </div>
      
      {/* Language Switcher */}
      <div className="flex gap-2 mb-6 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/50 w-fit">
        <Globe size={16} className="text-warm-400 self-center ml-2" />
        <button onClick={() => changeLanguage('uk')} className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors ${i18n.language === 'uk' ? 'bg-primary-500 text-white' : 'text-warm-600 hover:bg-warm-100'}`}>УКР</button>
        <button onClick={() => changeLanguage('ru')} className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors ${i18n.language === 'ru' ? 'bg-primary-500 text-white' : 'text-warm-600 hover:bg-warm-100'}`}>РУС</button>
        <button onClick={() => changeLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded-xl transition-colors ${i18n.language === 'en' ? 'bg-primary-500 text-white' : 'text-warm-600 hover:bg-warm-100'}`}>ENG</button>
      </div>

      <AnimatePresence>
        {showInstallCard && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-6 overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,rgba(15,12,41,0.95),rgba(36,36,62,0.92))] p-5 text-white shadow-[0_20px_48px_rgba(15,12,41,0.22)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/12 p-2.5">
                  {installPrompt ? <Download size={20} /> : <Share size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Установить как приложение</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    После установки LittleGuide будет открываться почти как отдельное приложение, без лишней панели браузера.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissInstallCard}
                className="rounded-xl p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Скрыть подсказку"
              >
                <X size={16} />
              </button>
            </div>

            {isIosInstallFlow && !installPrompt ? (
              <div className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed text-white/80">
                В Safari нажми <span className="font-bold">Поделиться</span>, потом выбери <span className="font-bold">На экран Домой</span>.
                После этого приложение будет запускаться отдельно и выглядеть заметно лучше на iPhone.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstall}
                className="mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900"
              >
                <Download size={18} />
                Установить приложение
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-5 bg-gradient-to-r from-[#0057B7]/10 to-[#FFDD00]/10 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0057B7]/20 to-[#FFDD00]/20 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="bg-white/80 p-2 rounded-full shadow-sm">
            <Heart className="text-[#0057B7] fill-[#FFDD00]" size={20} />
          </div>
          <p className="text-sm font-bold leading-relaxed pt-1 bg-gradient-to-r from-blue-700 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
            {t('mission_text')}
          </p>
        </div>
      </motion.div>
      
      <AnimatePresence>
      {isCustomizing && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-primary-50/70 backdrop-blur-md rounded-2xl border border-primary-100/50 shadow-inner">
               <div className="flex items-center gap-2 mb-4">
                <Settings2 size={18} className="text-primary-600" />
                <h3 className="font-bold text-primary-900 text-sm">{t('quick_access')}</h3>
             </div>
             <p className="text-[11px] text-primary-700 mb-4 opacity-80 leading-relaxed">
                {t('quick_access_desc')}
             </p>
             <div className="grid grid-cols-2 gap-2">
                {allPinnable.map(item => {
                    const isPinned = userState.customNavItems.includes(item.id);
                    const Icon = item.icon;
                    return (
                        <button 
                            key={item.id}
                            onClick={() => togglePin(item.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isPinned ? 'bg-white/80 backdrop-blur-sm border-primary-400 shadow-md ring-1 ring-primary-100' : 'bg-white/30 backdrop-blur-sm border-transparent opacity-60'}`}
                        >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isPinned ? 'bg-primary-100 text-primary-600' : 'bg-warm-100 text-warm-400'}`}>
                                <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className={`text-xs font-bold block truncate ${isPinned ? 'text-primary-900' : 'text-warm-800'}`}>{item.title}</span>
                                {isPinned && <span className="text-[8px] uppercase tracking-tighter text-primary-400 font-black">{t('in_menu')}</span>}
                            </div>
                            <CheckCircle2 size={14} className={isPinned ? 'text-primary-500' : 'text-transparent'} />
                        </button>
                    )
                })}
             </div>
          </div>
          </motion.div>
      )}
      </AnimatePresence>

      <motion.div 
        className="grid gap-4 mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
      >
        {tools.map((tool) => {
            const Icon = tool.icon;
            return (
                <motion.button 
                    key={tool.id}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate(tool.id)}
                    className={`bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm flex items-center gap-4 transition-colors ${tool.bg} text-left w-full`}
                >
                    <div className={`p-3 rounded-full ${tool.color}`}>
                        <Icon size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-warm-900">{tool.title}</h3>
                        <p className="text-xs text-warm-500">{tool.desc}</p>
                    </div>
                    <ChevronRight size={20} className="text-warm-300" />
                </motion.button>
            )
        })}
      </motion.div>

      {/* Feedback Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 bg-gradient-to-br from-primary-100/70 to-warm-100/70 backdrop-blur-md rounded-3xl relative overflow-hidden border border-white/50 shadow-sm"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Puzzle size={100} className="text-primary-800" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <Puzzle size={24} className="text-primary-600" />
                <h3 className="font-bold text-primary-900">{t('together_better')}</h3>
            </div>
            
            <p className="text-sm text-primary-800/80 mb-4 leading-relaxed">
                {t('feedback_desc')}
            </p>

            {isSent ? (
                <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300 border border-white/50">
                    <div className="flex justify-center mb-2">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                             <Sparkles size={24} />
                        </div>
                    </div>
                    <h4 className="font-bold text-primary-900">{t('thanks_idea')}</h4>
                    <p className="text-xs text-primary-700 mt-1">{t('we_noted')}</p>
                </div>
            ) : (
                <div className="relative group">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={t('feedback_placeholder')}
                        className="w-full bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl p-4 pr-12 text-sm text-primary-900 placeholder-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-400/50 focus:outline-none transition-all resize-none h-28 shadow-sm"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!feedback.trim()}
                        className="absolute bottom-3 right-3 bg-primary-600 text-white p-2 rounded-lg shadow-lg hover:bg-primary-700 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:scale-75 transition-all duration-300"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}
        </div>
      </motion.div>

      {/* Account Section */}
      {onSignOut && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-warm-700">Аккаунт</p>
              {userEmail && <p className="text-xs text-warm-400 mt-0.5 truncate max-w-[200px]">{userEmail}</p>}
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

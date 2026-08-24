import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  MessageCircleHeart, 
  BookHeart, 
  Utensils, 
  LayoutGrid, 
  Camera, 
  Wand2, 
  Moon, 
  CloudLightning, 
  Trophy 
} from 'lucide-react';
import { UserState } from '../types';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userState: UserState;
}

const THEMES: Record<string, { bgImage: string, fallbackBg: string, overlay: string, iconColor: string }> = {
  'home': { 
    bgImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-primary-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-primary-500/20' 
  },
  'food': { 
    bgImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-orange-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-orange-500/20' 
  },
  'diary': { 
    bgImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-pink-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-pink-500/20' 
  },
  'chat': { 
    bgImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-blue-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-blue-500/20' 
  },
  'photo-ideas': { 
    bgImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-rose-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-rose-500/20' 
  },
  'magic-photo': { 
    bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-violet-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-violet-500/20' 
  },
  'storyteller': { 
    bgImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-indigo-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-indigo-500/20' 
  },
  'leaps': { 
    bgImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-cyan-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-cyan-500/20' 
  },
  'quests': { 
    bgImage: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-amber-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-amber-500/20' 
  },
  'menu': { 
    bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', 
    fallbackBg: 'bg-warm-50',
    overlay: 'bg-white/70', 
    iconColor: 'text-warm-500/20' 
  },
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, userState }) => {
  const { t } = useTranslation();

  const ALL_NAV_ITEMS: Record<string, { icon: any, label: string }> = {
    'home': { icon: Home, label: t('nav_home') },
    'food': { icon: Utensils, label: t('nav_food') },
    'diary': { icon: BookHeart, label: t('nav_diary') },
    'chat': { icon: MessageCircleHeart, label: t('nav_chat') },
    'photo-ideas': { icon: Camera, label: t('nav_photo_ideas') },
    'magic-photo': { icon: Wand2, label: t('nav_magic_photo') },
    'storyteller': { icon: Moon, label: t('nav_storyteller') },
    'leaps': { icon: CloudLightning, label: t('nav_leaps') },
    'quests': { icon: Trophy, label: t('nav_quests') },
    'menu': { icon: LayoutGrid, label: t('nav_menu') },
  };

  // Fixed tabs
  const startItems = ['home'];
  const endItems = ['menu'];
  
  // Custom middle tabs from user state or fallback to defaults
  const middleItems = (userState && userState.customNavItems && userState.customNavItems.length > 0) 
    ? userState.customNavItems 
    : ['food', 'diary', 'chat'];
  
  const navIds = [...startItems, ...middleItems, ...endItems];

  // Logic to highlight 'menu' tab if activeTab is a sub-feature not currently in middle nav
  const isMenuTabActive = activeTab === 'menu' || (!middleItems.includes(activeTab) && activeTab !== 'home');

  const currentTheme = THEMES[activeTab] || THEMES['home'];
  const ThemeIcon = ALL_NAV_ITEMS[activeTab]?.icon || ALL_NAV_ITEMS['home'].icon;

  return (
    <div className="app-shell bg-warm-50 text-warm-900 font-sans relative overflow-hidden">
      <div className="app-frame relative overflow-hidden bg-warm-50 md:my-4 md:rounded-[32px] md:border md:border-white/50 md:shadow-2xl">
         
         {/* Dynamic Background */}
         <AnimatePresence mode="wait">
            <motion.img
              key={`bg-img-${activeTab}`}
              src={currentTheme.bgImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
         </AnimatePresence>

         {/* Glass Overlay to ensure text readability */}
         <div className={`absolute inset-0 ${currentTheme.overlay} backdrop-blur-xl z-0 transition-colors duration-700`} />

         {/* Watermark Icon */}
         <AnimatePresence mode="wait">
            <motion.div
              key={`icon-${activeTab}`}
              initial={{ opacity: 0, scale: 0.5, rotate: -20, y: 50 }}
              animate={{ 
                opacity: 0.4, 
                scale: 1, 
                rotate: 0, 
                y: 0,
                transition: { duration: 0.8, type: "spring" }
              }}
              exit={{ opacity: 0, scale: 1.2, rotate: 20, y: -50, transition: { duration: 0.4 } }}
              className={`absolute -right-16 top-32 z-0 ${currentTheme.iconColor} blur-[2px] pointer-events-none`}
            >
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <ThemeIcon size={350} strokeWidth={1.5} />
              </motion.div>
            </motion.div>
         </AnimatePresence>
         
        {/* Content Area */}
        <main className="app-scroll no-scrollbar relative z-10">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="app-bottom-nav absolute bottom-0 left-0 w-full z-50">
          <div className="glass-card mx-auto grid grid-cols-5 gap-1 rounded-[28px] border border-white/60 p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
          {navIds.map((id) => {
            const itemConfig = ALL_NAV_ITEMS[id] || ALL_NAV_ITEMS['menu'];
            const Icon = itemConfig.icon;
            
            let isActive = activeTab === id;
            // Special case for 'menu' if we are in a sub-view that isn't pinned
            if (id === 'menu' && isMenuTabActive) isActive = true;

            return (
              <motion.button
                key={id}
                onClick={() => onTabChange(id)}
                whileTap={{ scale: 0.9 }}
                className={`relative flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[22px] px-1.5 py-2 transition-all duration-300 ${
                  isActive ? 'text-primary-600' : 'text-warm-400 hover:text-warm-600'
                }`}
              >
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl transition-colors">
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-2xl bg-primary-50/90 shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                </div>
                <span className={`w-full truncate text-center text-[10px] font-extrabold tracking-tight ${isActive ? 'text-primary-700' : 'text-warm-500'}`}>
                    {itemConfig.label}
                </span>
              </motion.button>
            );
          })}
          </div>
        </nav>
      </div>
    </div>
  );
};

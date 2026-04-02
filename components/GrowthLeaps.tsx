import React from 'react';
import { motion } from 'motion/react';
import { CloudRain, Sun, CloudLightning, Info } from 'lucide-react';
import { GrowthLeap } from '../types';
import { useTranslation } from 'react-i18next';

export const GrowthLeaps: React.FC = () => {
  const { t } = useTranslation();

  const LEAPS: GrowthLeap[] = [
    { week: 4, title: t('leap_1_title'), description: t('leap_1_desc'), isStormy: false, signs: [] },
    { week: 5, title: t('leap_2_title'), description: t('leap_2_desc'), isStormy: true, signs: [t('sign_crying'), t('sign_bad_sleep')] },
    { week: 6, title: t('leap_3_title'), description: t('leap_3_desc'), isStormy: false, signs: [] },
    { week: 8, title: t('leap_4_title'), description: t('leap_4_desc'), isStormy: true, signs: [t('sign_clingy'), t('sign_refuse_food')] },
  ];

  return (
    <div className="px-6 pt-8 pb-20">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h2 className="text-2xl font-bold text-warm-900">{t('growth_calendar')}</h2>
            <p className="text-xs text-warm-500">{t('mood_forecast')}</p>
         </div>
         <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <CloudLightning size={24} />
         </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 border-l-4 border-l-primary-500 mb-8">
        <h3 className="font-bold text-lg text-warm-900 mb-1">{t('now_week', { week: 5 })}</h3>
        <p className="text-primary-600 font-medium text-sm mb-4">{t('storm_possible')}</p>
        <p className="text-warm-600 text-sm leading-relaxed mb-4">
            {t('leap_desc_current')}
        </p>
        <div className="bg-primary-50 rounded-lg p-3 text-xs text-primary-800 flex gap-2">
            <Info size={16} className="shrink-0" />
            <span>{t('leap_tip')}</span>
        </div>
      </div>

      <h3 className="font-bold text-warm-800 mb-4">{t('mood_chart')}</h3>
      <motion.div 
        className="space-y-3 relative"
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
        <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-warm-200" />
        
        {LEAPS.map((leap) => (
            <motion.div 
                key={leap.week} 
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                className="flex items-center relative z-10"
            >
                <div className={`w-12 flex-shrink-0 text-xs font-bold text-right pr-4 ${leap.week === 5 ? 'text-primary-600' : 'text-warm-400'}`}>
                    {t('week_short', { week: leap.week })}
                </div>
                <div className={`flex-1 p-4 rounded-xl border flex items-center gap-4 ${leap.isStormy ? 'bg-white/80 backdrop-blur-sm border-red-100/50 shadow-sm' : 'bg-warm-50/50 backdrop-blur-sm border-transparent opacity-80'}`}>
                    <div className={`p-2 rounded-full ${leap.isStormy ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-500'}`}>
                        {leap.isStormy ? <CloudRain size={18} /> : <Sun size={18} />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${leap.isStormy ? 'text-red-900' : 'text-warm-700'}`}>{leap.title}</h4>
                        {leap.isStormy && (
                            <div className="flex gap-2 mt-1">
                                {leap.signs.map(sign => (
                                    <span key={sign} className="text-[10px] bg-red-50 text-red-400 px-1.5 py-0.5 rounded">
                                        {sign}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
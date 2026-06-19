import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../types';
import { ArrowRight, Baby, User, Calendar, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: (data: UserState) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserState>>({
    parentName: '',
    childName: '',
    childBirthDate: '',
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (formData.parentName && formData.childName && formData.childBirthDate) {
        onComplete({
          parentName: formData.parentName,
          childName: formData.childName,
          childBirthDate: formData.childBirthDate,
          isOnboarded: true,
          customNavItems: ['food', 'diary', 'chat'], // Initial default layout
        });
      }
    }
  };

  const isStepValid = () => {
    if (step === 1) return !!formData.parentName?.trim();
    if (step === 2) return !!formData.childName?.trim();
    if (step === 3) return !!formData.childBirthDate;
    return false;
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#f1eee8_40%,#e9f3e7_100%)] px-4 pb-[max(24px,var(--safe-bottom))] pt-[max(18px,var(--safe-top))] font-sans sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-12 right-0 h-40 w-40 rounded-full bg-primary-200/50 blur-3xl" />
        <div className="absolute bottom-16 left-0 h-44 w-44 rounded-full bg-orange-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-42px)] w-full max-w-md items-center">
      <div className="glass-card w-full rounded-[30px] border border-white/60 p-6 shadow-xl sm:p-8 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-warm-100">
            <div 
                className="h-full bg-primary-500 transition-all duration-500" 
                style={{ width: `${(step / 3) * 100}%` }}
            />
        </div>

        <div className="mt-6 mb-8 text-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-sm"
                >
                    {step === 1 && <User size={32} />}
                    {step === 2 && <Baby size={32} />}
                    {step === 3 && <Calendar size={32} />}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.h2 
                    key={`title-${step}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-2 text-3xl font-bold text-warm-900"
                >
                    {step === 1 && t('onboarding_step1_title')}
                    {step === 2 && t('onboarding_step2_title')}
                    {step === 3 && t('onboarding_step3_title')}
                </motion.h2>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.p 
                    key={`desc-${step}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mx-auto max-w-[260px] text-sm leading-relaxed text-warm-500"
                >
                    {step === 1 && t('onboarding_step1_desc')}
                    {step === 2 && t('onboarding_step2_desc')}
                    {step === 3 && t('onboarding_step3_desc')}
                </motion.p>
            </AnimatePresence>
        </div>

        <div className="space-y-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={`input-${step}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {step === 1 && (
                        <input
                            type="text"
                            value={formData.parentName}
                            onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                            placeholder={t('onboarding_parent_name_placeholder')}
                            className="w-full rounded-[24px] border border-warm-200 bg-white/80 px-5 py-4 text-center text-lg font-semibold text-warm-800 shadow-sm transition-colors placeholder:text-warm-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                            autoFocus
                        />
                    )}

                    {step === 2 && (
                        <input
                            type="text"
                            value={formData.childName}
                            onChange={(e) => setFormData({...formData, childName: e.target.value})}
                            placeholder={t('onboarding_child_name_placeholder')}
                            className="w-full rounded-[24px] border border-warm-200 bg-white/80 px-5 py-4 text-center text-lg font-semibold text-warm-800 shadow-sm transition-colors placeholder:text-warm-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                            autoFocus
                        />
                    )}

                    {step === 3 && (
                        <input
                            type="date"
                            value={formData.childBirthDate}
                            onChange={(e) => setFormData({...formData, childBirthDate: e.target.value})}
                            className="w-full rounded-[24px] border border-warm-200 bg-white/80 px-5 py-4 text-center text-lg font-semibold text-warm-800 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                            max={new Date().toISOString().split('T')[0]}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            <motion.button
                whileTap={isStepValid() ? { scale: 0.95 } : {}}
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[24px] bg-warm-900 px-5 py-4 text-base font-bold text-white shadow-lg shadow-warm-900/20 transition-all disabled:scale-95 disabled:opacity-50 group"
            >
                {step === 3 ? (
                    <>
                        {t('onboarding_start')} <Heart size={20} className="text-red-400 fill-red-400" />
                    </>
                ) : (
                    <>
                        {t('onboarding_next')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </motion.button>
        </div>
      </div>
      </div>
    </div>
  );
};

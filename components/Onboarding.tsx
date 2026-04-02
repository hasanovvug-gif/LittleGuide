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
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-primary-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 relative overflow-hidden border border-white/50">
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
                    className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600"
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
                    className="text-2xl font-bold text-warm-900 mb-2"
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
                    className="text-warm-500 text-sm"
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
                            className="w-full text-center text-xl border-b-2 border-warm-200 py-2 focus:outline-none focus:border-primary-500 bg-transparent placeholder-warm-300 text-warm-800 transition-colors"
                            autoFocus
                        />
                    )}

                    {step === 2 && (
                        <input
                            type="text"
                            value={formData.childName}
                            onChange={(e) => setFormData({...formData, childName: e.target.value})}
                            placeholder={t('onboarding_child_name_placeholder')}
                            className="w-full text-center text-xl border-b-2 border-warm-200 py-2 focus:outline-none focus:border-primary-500 bg-transparent placeholder-warm-300 text-warm-800 transition-colors"
                            autoFocus
                        />
                    )}

                    {step === 3 && (
                        <input
                            type="date"
                            value={formData.childBirthDate}
                            onChange={(e) => setFormData({...formData, childBirthDate: e.target.value})}
                            className="w-full text-center text-xl border-b-2 border-warm-200 py-2 focus:outline-none focus:border-primary-500 bg-transparent text-warm-800 transition-colors"
                            max={new Date().toISOString().split('T')[0]}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            <motion.button
                whileTap={isStepValid() ? { scale: 0.95 } : {}}
                onClick={handleNext}
                disabled={!isStepValid()}
                className="w-full py-4 bg-warm-900 text-white rounded-xl font-bold shadow-lg shadow-warm-900/20 disabled:opacity-50 disabled:scale-95 transition-all flex items-center justify-center gap-2 group"
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
  );
};
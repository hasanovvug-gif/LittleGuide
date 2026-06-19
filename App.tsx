import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Layout } from './components/Layout';
import { DashboardSummary } from './components/DashboardSummary';
import { DailyCard } from './components/DailyCard';
import { AIChat } from './components/AIChat';
import { Quests } from './components/Quests';
import { GrowthDiary } from './components/GrowthDiary';
import { FoodDiary } from './components/FoodDiary';
import { ToolsMenu } from './components/ToolsMenu';
import { Storyteller } from './components/Storyteller';
import { GrowthLeaps } from './components/GrowthLeaps';
import { PhotoIdeas } from './components/PhotoIdeas';
import { MagicPhoto } from './components/MagicPhoto';
import { ArtStudio } from './components/ArtStudio';
import { SleepTracker } from './components/SleepTracker';
import { Onboarding } from './components/Onboarding';
import { INITIAL_QUESTS, MOCK_ACTIVITY, MOCK_BRAIN_FACT, PARENT_AFFIRMATIONS } from './constants';
import { generateDailyActivity } from './services/geminiService';
import { getUserProfile, saveUserProfile } from './services/firestoreService';
import { signOut } from './services/authService';
import { DailyActivity, UserState } from './types';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface AppProps {
  userId: string;
  userEmail: string;
}

function App({ userId, userEmail }: AppProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [activity, setActivity] = useState<DailyActivity>({
    title: t('mock_activity_title', { defaultValue: MOCK_ACTIVITY.title }),
    description: t('mock_activity_desc', { defaultValue: MOCK_ACTIVITY.description }),
    category: MOCK_ACTIVITY.category,
    duration: t('mock_activity_duration', { defaultValue: MOCK_ACTIVITY.duration }),
    isCompleted: false,
    brainFact: MOCK_ACTIVITY.brainFact
  });
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // ─── Save to Firestore helper ────────────────────────────────
  const persistState = useCallback(async (newState: UserState) => {
    setUserState(newState);
    await saveUserProfile(userId, newState);
  }, [userId]);

  // ─── Load user profile from Firestore ───────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setAffirmationIndex(Math.floor(Math.random() * 5));

      try {
        const profile = await getUserProfile(userId);

        if (profile) {
          // Migration: ensure customNavItems exists
          if (!profile.customNavItems) {
            profile.customNavItems = ['food', 'diary', 'chat'];
            await saveUserProfile(userId, profile);
          }

          // Streak & quest reset logic
          const todayStr = new Date().toISOString().split('T')[0];
          let stateChanged = false;

          if (profile.lastActiveDate) {
            const lastDate = new Date(profile.lastActiveDate);
            const todayDate = new Date(todayStr);
            const diffDays = Math.ceil(
              Math.abs(todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays > 1) {
              profile.streakCount = 0;
              stateChanged = true;
            }

            if (diffDays >= 1 && profile.activeQuests) {
              profile.activeQuests = profile.activeQuests.map((q) => ({
                ...q,
                isCompletedToday: false,
              }));
              stateChanged = true;
            }
          }

          if (stateChanged) {
            await saveUserProfile(userId, profile);
          }

          setUserState(profile);

          // Generate daily activity
          setIsLoadingActivity(true);
          const birthDate = new Date(profile.childBirthDate);
          const today = new Date();
          let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
          months -= birthDate.getMonth();
          months += today.getMonth();
          if (today.getDate() < birthDate.getDate()) months--;
          const age = Math.max(0, months);

          generateDailyActivity(age, profile.childName, i18n.language).then((act) => {
            setActivity(act);
            setIsLoadingActivity(false);
          });
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [userId]);

  // ─── Age helper ──────────────────────────────────────────────
  const getAgeMonths = () => {
    if (!userState) return 12;
    const birthDate = new Date(userState.childBirthDate);
    const today = new Date();
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();
    if (today.getDate() < birthDate.getDate()) months--;
    return Math.max(0, months);
  };

  const handleRefreshActivity = async () => {
    if (!userState) return;
    setIsLoadingActivity(true);
    const age = getAgeMonths();
    const newActivity = await generateDailyActivity(age, userState.childName, i18n.language);
    setActivity(newActivity);
    setIsLoadingActivity(false);
  };

  useEffect(() => {
    if (userState?.isOnboarded) {
      handleRefreshActivity();
    }
  }, [i18n.language]);

  const handleCompleteActivity = async () => {
    setActivity((prev) => ({ ...prev, isCompleted: true }));
    if (userState) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (userState.lastActiveDate !== todayStr) {
        await persistState({
          ...userState,
          streakCount: (userState.streakCount || 0) + 1,
          lastActiveDate: todayStr,
        });
      }
    }
  };

  const handleOnboardingComplete = async (data: UserState) => {
    const fullData: UserState = {
      ...data,
      customNavItems: ['food', 'diary', 'chat'],
    };
    await persistState(fullData);
    generateDailyActivity(0, data.childName, i18n.language).then((act) => setActivity(act));
  };

  const handleUpdateNav = async (items: string[]) => {
    if (!userState) return;
    await persistState({ ...userState, customNavItems: items });
  };

  const handleUpdateUserState = async (newState: UserState) => {
    await persistState(newState);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // ─── Loading state ───────────────────────────────────────────
  if (isLoadingProfile) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}>
        <motion.div
          style={{ fontSize: 48 }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          👶
        </motion.div>
      </div>
    );
  }

  if (!userState || !userState.isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <div className="px-5 pb-0 pt-5 sm:px-6">
              <div className="glass-card rounded-[22px] border border-white/60 p-3.5 text-center shadow-sm">
                <p className="text-sm font-bold leading-relaxed text-warm-700">✨ {t(`affirmation_${affirmationIndex + 1}`)}</p>
              </div>
            </div>
            <DashboardSummary userState={userState} />
            <DailyCard
              activity={activity}
              brainFact={activity.brainFact || MOCK_BRAIN_FACT}
              userState={userState}
              onComplete={handleCompleteActivity}
              onRefreshActivity={handleRefreshActivity}
              loading={isLoadingActivity}
            />
          </>
        );
      case 'food':
        return <FoodDiary userState={userState} onUpdateUserState={handleUpdateUserState} />;
      case 'diary':
        return <GrowthDiary userState={userState} onUpdateUserState={handleUpdateUserState} />;
      case 'chat':
        return <AIChat userState={userState} />;
      case 'menu':
        return (
          <ToolsMenu
            onNavigate={setActiveTab}
            userState={userState}
            onUpdateNav={handleUpdateNav}
            onSignOut={handleSignOut}
            userEmail={userEmail}
          />
        );
      case 'storyteller':
        return <Storyteller userState={userState} />;
      case 'leaps':
        return <GrowthLeaps />;
      case 'quests':
        return <Quests userState={userState} onUpdateUserState={handleUpdateUserState} />;
      case 'photo-ideas':
        return <PhotoIdeas userState={userState} />;
      case 'magic-photo':
        return <MagicPhoto />;
      case 'art-studio':
        return <ArtStudio />;
      case 'sleep':
        return <SleepTracker userState={userState} onUpdateUserState={handleUpdateUserState} />;
      default:
        return <div className="p-6">{t('section_in_development')}</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} userState={userState}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
          className="h-full"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default App;

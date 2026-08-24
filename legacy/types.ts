export interface DailyActivity {
  title: string;
  description: string;
  category: 'Motor' | 'Sensory' | 'Cognitive' | 'Social';
  duration: string;
  isCompleted: boolean;
  brainFact?: {
    title: string;
    fact: string;
  };
}

export interface BrainFact {
  title: string;
  fact: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Quest {
  id: string;
  title: string;
  totalDays: number;
  currentDay: number;
  description: string;
  color: string;
  dailyTask?: string; // Kept for backwards compatibility
  tasks?: string[]; // Array of tasks for each day
  isCompletedToday?: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  timestamp: number;
  type: 'text' | 'quote' | 'achievement' | 'audio' | 'photo' | 'summary';
  content: string; // Text content or Audio Title
  audioUrl?: string; // For audio entries
  imageUrl?: string; // For photo entries
  duration?: string; // For audio entries
  tags?: string[];
}

export interface SleepSession {
  id: string;
  startTime: string; // ISO Date string
  endTime: string | null; // ISO Date string, null if currently sleeping
  durationMinutes: number; // 0 if currently sleeping
}

export interface UserState {
  parentName: string;
  childName: string;
  childBirthDate: string; // ISO Date string
  isOnboarded: boolean;
  customNavItems: string[]; // IDs of 3 middle nav items
  streakCount?: number;
  lastActiveDate?: string;
  activeQuests?: Quest[];
  sleepSessions?: SleepSession[];
  foodStatuses?: Record<string, FoodItem['status']>;
  diaryEntries?: DiaryEntry[];
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  category: 'veg' | 'fruit' | 'grain';
  status: 'none' | 'liked' | 'disliked' | 'neutral';
}

export interface GrowthLeap {
  week: number;
  title: string;
  description: string;
  isStormy: boolean;
  signs: string[];
}
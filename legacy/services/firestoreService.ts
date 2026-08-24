import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserState, SleepSession, DiaryEntry, Quest } from '../types';

// ─── USER PROFILE ───────────────────────────────────────────────

export const getUserProfile = async (userId: string): Promise<UserState | null> => {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserState) : null;
};

export const saveUserProfile = async (
  userId: string,
  data: Partial<UserState>
): Promise<void> => {
  const ref = doc(db, 'users', userId);
  await setDoc(ref, data, { merge: true });
};

// ─── SLEEP SESSIONS ─────────────────────────────────────────────

export const getSleepSessions = async (userId: string): Promise<SleepSession[]> => {
  const col = collection(db, 'users', userId, 'sleepSessions');
  const q = query(col, orderBy('startTime', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SleepSession));
};

export const addSleepSession = async (
  userId: string,
  session: Omit<SleepSession, 'id'>
): Promise<string> => {
  const col = collection(db, 'users', userId, 'sleepSessions');
  const ref = await addDoc(col, { ...session, _createdAt: serverTimestamp() });
  return ref.id;
};

export const updateSleepSession = async (
  userId: string,
  sessionId: string,
  data: Partial<SleepSession>
): Promise<void> => {
  const ref = doc(db, 'users', userId, 'sleepSessions', sessionId);
  await updateDoc(ref, data as Record<string, unknown>);
};

export const deleteSleepSession = async (userId: string, sessionId: string): Promise<void> => {
  const ref = doc(db, 'users', userId, 'sleepSessions', sessionId);
  await deleteDoc(ref);
};

// ─── DIARY ENTRIES ──────────────────────────────────────────────

export const getDiaryEntries = async (userId: string): Promise<DiaryEntry[]> => {
  const col = collection(db, 'users', userId, 'diaryEntries');
  const q = query(col, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DiaryEntry));
};

export const addDiaryEntry = async (
  userId: string,
  entry: Omit<DiaryEntry, 'id'>
): Promise<string> => {
  const col = collection(db, 'users', userId, 'diaryEntries');
  const ref = await addDoc(col, entry);
  return ref.id;
};

export const deleteDiaryEntry = async (userId: string, entryId: string): Promise<void> => {
  const ref = doc(db, 'users', userId, 'diaryEntries', entryId);
  await deleteDoc(ref);
};

// ─── QUESTS ─────────────────────────────────────────────────────

export const getQuests = async (userId: string): Promise<Quest[]> => {
  const col = collection(db, 'users', userId, 'quests');
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quest));
};

export const saveQuest = async (userId: string, quest: Quest): Promise<void> => {
  const ref = doc(db, 'users', userId, 'quests', quest.id);
  await setDoc(ref, quest, { merge: true });
};

export const deleteQuest = async (userId: string, questId: string): Promise<void> => {
  const ref = doc(db, 'users', userId, 'quests', questId);
  await deleteDoc(ref);
};

// ─── FOOD STATUSES ──────────────────────────────────────────────

export const getFoodStatuses = async (
  userId: string
): Promise<Record<string, string>> => {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  return (snap.data()?.foodStatuses as Record<string, string>) ?? {};
};

export const updateFoodStatus = async (
  userId: string,
  foodId: string,
  status: string
): Promise<void> => {
  const ref = doc(db, 'users', userId);
  await setDoc(ref, { foodStatuses: { [foodId]: status } }, { merge: true });
};

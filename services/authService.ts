import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export type AuthUser = User;

export const signInWithGoogle = async (): Promise<AuthUser> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
};

export const registerWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const onAuthChange = (callback: (user: AuthUser | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): AuthUser | null => {
  return auth.currentUser;
};

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadDiaryPhoto = async (userId: string, file: File): Promise<string> => {
  const timestamp = Date.now();
  const path = `users/${userId}/diary/${timestamp}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const uploadDiaryAudio = async (userId: string, blob: Blob): Promise<string> => {
  const timestamp = Date.now();
  const path = `users/${userId}/diary/${timestamp}_audio.webm`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const deleteDiaryMedia = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn('Could not delete media file:', error);
  }
};

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { storage } from './config';
import { getCurrentUserId } from '../state/session';

export const uploadAudioFile = async (uri: string, filename: string): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Utilisateur non authentifié');
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `audio/${userId}/${Date.now()}-${filename}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);

  if ('close' in blob && typeof (blob as any).close === 'function') {
    try {
      (blob as any).close();
    } catch (error) {
      // ignore close failures
    }
  }

  return getDownloadURL(storageRef);
};

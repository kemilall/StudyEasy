import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAe-zDsnV9ytco9DN3Lesk481TFZwuDmig',
  authDomain: 'studyeasy-3fb24.firebaseapp.com',
  projectId: 'studyeasy-3fb24',
  storageBucket: 'studyeasy-3fb24.firebasestorage.app',
  messagingSenderId: '137992674175',
  appId: '1:137992674175:web:f0f77b2718a0341a55184a',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

try {
  initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Auth has already been initialised.
}

export const firebaseApp = app;
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

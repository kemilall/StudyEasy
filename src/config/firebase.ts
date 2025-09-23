// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAe-zDsnV9ytco9DN3Lesk481TFZwuDmig",
  authDomain: "studyeasy-3fb24.firebaseapp.com",
  projectId: "studyeasy-3fb24",
  storageBucket: "studyeasy-3fb24.firebasestorage.app",
  messagingSenderId: "137992674175",
  appId: "1:137992674175:web:f0f77b2718a0341a55184a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;

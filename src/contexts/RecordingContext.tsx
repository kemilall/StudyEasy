import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface RecordingSession {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  lessonId: string;
  lessonName: string;
  durationMillis: number;
}

interface RecordingContextType {
  isRecording: boolean;
  isPaused: boolean;
  currentSession: RecordingSession | null;
  isOnRecordingScreen: boolean;
  startRecordingSession: (session: RecordingSession) => void;
  pauseRecordingSession: () => void;
  resumeRecordingSession: () => void;
  stopRecordingSession: () => void;
  deleteRecordingSession: () => void;
  setIsOnRecordingScreen: (value: boolean) => void;
  updateSessionDuration: (durationMillis: number) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const useRecording = (): RecordingContextType => {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [isOnRecordingScreen, setIsOnRecordingScreen] = useState(false);

  const wasRecordingBeforeBackgroundRef = useRef(false);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isRecording && !isPaused) {
        // App going to background while recording - pause the recording
        wasRecordingBeforeBackgroundRef.current = true;
        pauseRecordingSession();
      } else if (nextAppState === 'active' && wasRecordingBeforeBackgroundRef.current && !isOnRecordingScreen) {
        // App coming back to foreground - resume recording if we were recording before
        wasRecordingBeforeBackgroundRef.current = false;
        resumeRecordingSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isRecording, isPaused, isOnRecordingScreen]);

  const startRecordingSession = (session: RecordingSession) => {
    setCurrentSession(session);
    setIsRecording(true);
    setIsPaused(false);
  };

  const pauseRecordingSession = () => {
    setIsPaused(true);
    setIsRecording(false);
  };

  const resumeRecordingSession = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const stopRecordingSession = () => {
    setIsRecording(false);
    setIsPaused(false);
    setCurrentSession(null);
  };

  const deleteRecordingSession = () => {
    stopRecordingSession();
  };

  const updateSessionDuration = (durationMillis: number) => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        durationMillis,
      });
    }
  };

  const value: RecordingContextType = {
    isRecording,
    isPaused,
    currentSession,
    isOnRecordingScreen,
    startRecordingSession,
    pauseRecordingSession,
    resumeRecordingSession,
    stopRecordingSession,
    deleteRecordingSession,
    setIsOnRecordingScreen,
    updateSessionDuration,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};
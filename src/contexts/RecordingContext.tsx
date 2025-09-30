import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordingDraft } from '../types';

interface RecordingContextType {
  isRecording: boolean;
  currentDraft: RecordingDraft | null;
  startRecording: (subjectId: string, subjectName: string, lessonName: string) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  saveAsDraft: () => void;
  cancelRecording: () => void;
  clearDraft: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<RecordingDraft | null>(null);
  const [hasStartedRecording, setHasStartedRecording] = useState(false);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      // Load the most recent draft
      const keys = await AsyncStorage.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith('draft_'));

      if (draftKeys.length > 0) {
        // Get the most recent draft
        const mostRecentKey = draftKeys.sort().pop();
        if (mostRecentKey) {
          const draftData = await AsyncStorage.getItem(mostRecentKey);
          if (draftData) {
            const draft = JSON.parse(draftData);
            setCurrentDraft(draft);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const startRecording = (subjectId: string, subjectName: string, lessonName: string) => {
    setIsRecording(true);
    setHasStartedRecording(true);

    // Create initial draft structure
    const draft: RecordingDraft = {
      id: `temp_${Date.now()}`,
      userId: '', // Will be filled by RecordingStudioScreen
      subjectId,
      subjectName,
      subjectColor: '', // Will be filled by RecordingStudioScreen
      lessonName,
      localFileUri: '',
      durationMillis: 0,
      segments: [],
      updatedAt: Date.now(),
      status: 'recording',
    };

    setCurrentDraft(draft);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const pauseRecording = () => {
    setIsRecording(false);
  };

  const resumeRecording = () => {
    setIsRecording(true);
  };

  const saveAsDraft = () => {
    setIsRecording(false);
    setCurrentDraft(null);
    // The draft will be saved by RecordingStudioScreen
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setCurrentDraft(null);
    setHasStartedRecording(false);
  };

  const clearDraft = () => {
    setCurrentDraft(null);
    setHasStartedRecording(false);
  };

  // Navigation logic
  useEffect(() => {
    if (hasStartedRecording && !isRecording && !currentDraft) {
      // After stopping recording and no draft, go back to home
      // This will be handled by the navigation container
    }
  }, [hasStartedRecording, isRecording, currentDraft]);

  const value: RecordingContextType = {
    isRecording,
    currentDraft,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveAsDraft,
    cancelRecording,
    clearDraft,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};

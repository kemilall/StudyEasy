import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { useRecording } from '../contexts/RecordingContext';
import { DataService } from '../services/dataService';
import { FileUploadService } from '../services/fileUploadService';
import { DoubleConfirmationModal } from '../components/DoubleConfirmationModal';
import { LiveActivityService } from '../services/liveActivityService';

interface RouteParams {
  subjectId: string;
  subjectName: string;
  subjectColor?: string;
  lessonId?: string;
  initialLessonName?: string;
}

// Global recording state to persist across navigation
let globalRecording: Audio.Recording | null = null;
let globalLessonId: string | null = null;

export const RecordingStudioScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const {
    currentSession,
    isRecording: contextIsRecording,
    isPaused: contextIsPaused,
    startRecordingSession,
    pauseRecordingSession,
    resumeRecordingSession,
    stopRecordingSession,
    deleteRecordingSession,
    setIsOnRecordingScreen,
    updateSessionDuration,
  } = useRecording();

  const {
    subjectId,
    subjectName,
    subjectColor = Colors.accent.blue,
    lessonId: existingLessonId,
    initialLessonName,
  } = route.params as RouteParams;

  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lessonId, setLessonId] = useState(existingLessonId || globalLessonId || '');
  const [showExitModal, setShowExitModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs
  const appState = useRef(AppState.currentState);
  const lessonNameRef = useRef(initialLessonName || currentSession?.lessonName || 'Enregistrement');
  const hasCreatedLesson = useRef(false);

  // Mark that we're on the recording screen
  useFocusEffect(
    React.useCallback(() => {
      setIsOnRecordingScreen(true);
      
      // Restore from global state if exists
      if (globalRecording && currentSession) {
        setRecording(globalRecording);
        setLessonId(currentSession.lessonId);
        setIsRecording(contextIsRecording);
        setIsPaused(contextIsPaused);
        lessonNameRef.current = currentSession.lessonName;
        setIsInitialized(true);
      }
      
      return () => {
        setIsOnRecordingScreen(false);
      };
    }, [])
  );

  useEffect(() => {
    setupAudio();

    // If there's an existing session, restore it
    if (currentSession && currentSession.lessonId === (existingLessonId || globalLessonId)) {
      setIsPaused(contextIsPaused);
      setIsRecording(contextIsRecording);
      setIsInitialized(true);
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Timer effect to increment duration during recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording && currentSession) {
      interval = setInterval(() => {
        const newDuration = (currentSession.durationMillis || 0) + 1000;
        updateSessionDuration(newDuration);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, currentSession]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      // App going to background - keep recording active
      // Recording will continue in background
    }
    appState.current = nextAppState;
  };

  const setupAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission microphone requise',
          'L\'application a besoin d\'accéder au microphone pour enregistrer.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
      Alert.alert('Erreur', 'Impossible de configurer l\'audio');
    }
  };

  const startRecording = async () => {
    try {
      const wasResuming = (recording || globalRecording) && isPaused;

      setIsRecording(true);
      setIsPaused(false);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      };

      if (wasResuming && (recording || globalRecording)) {
        const activeRecording = recording || globalRecording;
        await activeRecording!.startAsync();
        resumeRecordingSession();
      } else {
        const { recording: newRecording } = await Audio.Recording.createAsync(
          recordingOptions
        );
        setRecording(newRecording);
        globalRecording = newRecording;

        // Create lesson if not exists
        if (!lessonId && user && !hasCreatedLesson.current) {
          hasCreatedLesson.current = true;
          const newLessonId = await DataService.createLesson(user.uid, {
            subjectId,
            name: lessonNameRef.current,
            status: 'draft',
            duration: 0,
          });
          setLessonId(newLessonId);
          globalLessonId = newLessonId;

          // Start session in context
          startRecordingSession({
            subjectId,
            subjectName,
            subjectColor,
            lessonId: newLessonId,
            lessonName: lessonNameRef.current,
            durationMillis: 0,
          });
          // Start Live Activity
          await LiveActivityService.start(lessonNameRef.current, subjectName, subjectColor);
        } else if (lessonId) {
          // Resume existing session
          const existingDuration = currentSession?.durationMillis || 0;
          startRecordingSession({
            subjectId,
            subjectName,
            subjectColor,
            lessonId,
            lessonName: lessonNameRef.current,
            durationMillis: existingDuration,
          });
          await LiveActivityService.start(lessonNameRef.current, subjectName, subjectColor);
        }
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      setIsPaused(false);
      Alert.alert('Erreur', "Impossible de démarrer l'enregistrement. Vérifiez les permissions microphone.");
    }
  };

  const handlePauseRecording = async () => {
    if (!recording && !globalRecording) return;

    try {
      const activeRecording = recording || globalRecording;
      await activeRecording!.pauseAsync();
      
      setIsRecording(false);
      setIsPaused(true);
      pauseRecordingSession();
      await LiveActivityService.update(Math.floor((currentSession?.durationMillis || 0) / 1000), true);

    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const handleResumeRecording = async () => {
    await startRecording();
    await LiveActivityService.update(Math.floor((currentSession?.durationMillis || 0) / 1000), false);
  };

  const handleValidateRecording = async () => {
    const activeRecording = recording || globalRecording;
    if (!activeRecording) return;

    try {
      if (!lessonId && !globalLessonId) {
        Alert.alert(
          'Préparation en cours',
          'Veuillez patienter un instant...',
          [{ text: 'OK' }]
        );
        return;
      }

      const activeLessonId = lessonId || globalLessonId;

      // Final stop and get the recording
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      
      if (!uri) {
        Alert.alert('Erreur', 'Impossible de récupérer l\'enregistrement');
        return;
      }

      setRecording(null);
      globalRecording = null;
      setIsRecording(false);
      setIsPaused(false);

      stopRecordingSession();
      await LiveActivityService.stop();

      // Process the recording immediately
      await processRecording(uri, activeLessonId!);

    } catch (error) {
      console.error('Failed to validate recording:', error);
      Alert.alert('Erreur', 'Impossible de valider l\'enregistrement');
    }
  };

  const processRecording = async (audioUri: string, lessonIdToUse: string) => {
    if (!user) return;

    try {
      const storagePath = `audio/${user.uid}/${lessonIdToUse}/${Date.now()}.wav`;
      const audioUrl = await FileUploadService.uploadFileWithXHR(
        audioUri,
        storagePath,
        (progress) => console.log('Upload progress:', progress.progress)
      );

      const durationMinutes = Math.floor((currentSession?.durationMillis || 0) / 1000 / 60);
      await DataService.updateLesson(lessonIdToUse, {
        status: 'draft',
        audioUrl,
        duration: durationMinutes,
      });

      // Clean global state
      globalRecording = null;
      globalLessonId = null;

      // Navigate to ProcessingScreen
      (navigation as any).navigate('ProcessingScreen', {
        lessonId: lessonIdToUse,
        audioUrl,
        localUri: audioUri,
      });

    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Erreur', 'Impossible de traiter l\'enregistrement');
    }
  };

  const handleBackPress = () => {
    if (isPaused) {
      // When paused, show warning modal
      setShowExitModal(true);
    } else if (isRecording) {
      // When recording, just navigate away (bubble will appear)
      navigation.goBack();
    } else {
      // No recording, just go back
      navigation.goBack();
    }
  };

  const handleConfirmExit = async () => {
    // Delete the recording and lesson
    const activeRecording = recording || globalRecording;
    if (activeRecording) {
      try {
        await activeRecording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    }

    const activeLessonId = lessonId || globalLessonId;
    if (activeLessonId && user) {
      try {
        await DataService.deleteLesson(activeLessonId);
      } catch (error) {
        console.error('Failed to delete lesson:', error);
      }
    }

    // Clean global state
    globalRecording = null;
    globalLessonId = null;

    deleteRecordingSession();
    setShowExitModal(false);
    navigation.goBack();
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayDuration = currentSession?.durationMillis || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.subjectName}>{subjectName}</Text>
          <Text style={styles.lessonName}>{lessonNameRef.current}</Text>
        </View>
        
        <View style={{ width: 28 }} />
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(displayDuration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!isPaused ? (
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingActive,
            ]}
            onPress={isRecording ? handlePauseRecording : startRecording}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isRecording ? "pause" : "mic"} 
              size={32} 
              color={Colors.surface} 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.pausedContainer}>
            <Text style={styles.pausedText}>Enregistrement en pause</Text>
            <View style={styles.resumeValidateContainer}>
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={handleResumeRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={24} color={Colors.surface} />
                <Text style={styles.resumeButtonText}>Reprendre</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.validateButton}
                onPress={handleValidateRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={24} color={Colors.surface} />
                <Text style={styles.validateButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.quitButton}
              onPress={() => setShowExitModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.quitButtonText}>Quitter et supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Exit Confirmation Modal */}
      <DoubleConfirmationModal
        visible={showExitModal}
        title="Quitter l'enregistrement ?"
        message="Si vous quittez maintenant, l'enregistrement sera définitivement supprimé."
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitModal(false)}
        isDangerous={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    alignItems: 'center',
  },
  subjectName: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  lessonName: {
    ...Typography.title3,
    color: Colors.text.primary,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 56,
    fontWeight: '300',
    color: Colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.red,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  recordingActive: {
    backgroundColor: '#FF6B35',
  },
  pausedContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  pausedText: {
    ...Typography.title3,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  resumeValidateContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  resumeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  resumeButtonText: {
    ...Typography.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  validateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.green,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  validateButtonText: {
    ...Typography.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  quitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  quitButtonText: {
    ...Typography.body,
    color: Colors.accent.red,
    fontWeight: '600',
  },
});
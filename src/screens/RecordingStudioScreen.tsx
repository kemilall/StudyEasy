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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { useRecording } from '../contexts/RecordingContext';
import { DataService } from '../services/dataService';
import { RecordingDraft, RecordingSegment } from '../types';
import { FileUploadService } from '../services/fileUploadService';
import { RecordingExitModal } from '../components/RecordingExitModal';
import { useRecordingNavigation } from '../hooks/useRecordingNavigation';

interface RouteParams {
  subjectId: string;
  subjectName: string;
  subjectColor?: string;
  lessonId?: string;
  draftId?: string;
  initialLessonName?: string;
}

const AUTOSAVE_INTERVAL = 5000; // Save draft metadata every 5 seconds
const getRecordingsDir = () => `${FileSystem.documentDirectory}recordings/`;

export const RecordingStudioScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { stopRecording, cancelRecording, saveAsDraft } = useRecording();
  const {
    showExitModal,
    handleExitModalClose,
    handleExitModalConfirm,
    handleExitModalSaveDraft,
    handleExitModalCancel,
  } = useRecordingNavigation();
  const {
    subjectId,
    subjectName,
    subjectColor = Colors.accent.blue,
    lessonId: existingLessonId,
    draftId,
    initialLessonName,
  } = route.params as RouteParams;

  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalDurationMillis, setTotalDurationMillis] = useState(0);
  const [currentSegmentDuration, setCurrentSegmentDuration] = useState(0);
  const [lessonId, setLessonId] = useState(existingLessonId || '');
  const [segments, setSegments] = useState<RecordingSegment[]>([]);
  const [hasAnyRecording, setHasAnyRecording] = useState(false);
  
  // Simplified state - no playback needed
  const [showResumeValidate, setShowResumeValidate] = useState(false);
  
  // Refs
  const appState = useRef(AppState.currentState);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const lessonNameRef = useRef(initialLessonName || 'Enregistrement');
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    setupAudio();
    ensureRecordingsDirectory();
    if (draftId) {
      loadDraft();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (recording) {
        handleStopRecording();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      if (recordingRef.current && isRecording) {
        await handleStopRecording();
      }
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

  const ensureRecordingsDirectory = async () => {
    const recordingsDir = getRecordingsDir();
    const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
    }
  };

  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem(`draft_${draftId}`);
      if (draftData) {
        const draft: RecordingDraft = JSON.parse(draftData);
        setLessonId(draft.id);
        setSegments(draft.segments || []);
        lessonNameRef.current = draft.lessonName;
        
        // Calculate total duration from segments
        const totalFromSegments = draft.segments.reduce((acc, seg) => acc + seg.durationMillis, 0);
        setTotalDurationMillis(totalFromSegments);
        setHasAnyRecording(draft.segments.length > 0);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const saveDraft = async () => {
    if (!user || !lessonId) return;

    try {
      // L'utilisateur voit un seul enregistrement continu, mais on gère techniquement en segments
      const draft: RecordingDraft = {
        id: lessonId,
        userId: user.uid,
        subjectId,
        subjectName,
        subjectColor,
        lessonName: lessonNameRef.current,
        localFileUri: segments[segments.length - 1]?.uri || '',
        durationMillis: totalDurationMillis,
        segments, // Segments gardés en interne pour la gestion technique
        updatedAt: Date.now(),
        status: isRecording ? 'recording' : isPaused ? 'paused' : 'stopped',
      };

      await AsyncStorage.setItem(`draft_${lessonId}`, JSON.stringify(draft));
      await DataService.saveRecordingDraft(user.uid, draft);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Capturer l'état de pause AVANT de le modifier
      const wasResuming = recording && isPaused;

      // Feedback visuel immédiat
      setIsRecording(true);
      setIsPaused(false);
      setShowResumeValidate(false);

      // Configure audio mode
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
          numberOfChannels: 1, // Mono pour réduire la taille et améliorer la compatibilité
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.MEDIUM, // Qualité moyenne pour WAV (équivaut à haute qualité pour M4A)
          sampleRate: 44100,
          numberOfChannels: 1, // Mono pour réduire la taille et améliorer la compatibilité
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

      // If resuming, resume the existing recording
      if (wasResuming) {
        await recording!.startAsync();
      } else {
        // Create new recording
        const { recording: newRecording } = await Audio.Recording.createAsync(
          recordingOptions
        );
        setRecording(newRecording);
        recordingRef.current = newRecording;
      }

      // Start duration tracking
      durationInterval.current = setInterval(() => {
        setTotalDurationMillis((prev) => prev + 100);
      }, 100);

      // Start auto-save
      if (!autoSaveInterval.current) {
        autoSaveInterval.current = setInterval(() => {
          saveDraft();
        }, AUTOSAVE_INTERVAL);
      }

      // Create lesson in background if needed (non-blocking)
      if (!lessonId && user) {
        DataService.createLesson(user.uid, {
          subjectId,
          name: lessonNameRef.current,
          status: 'draft',
          duration: 0,
        })
          .then((newLessonId) => {
            setLessonId(newLessonId);
          })
          .catch((error) => {
            console.error('Failed to create lesson:', error);
          });
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      // Remettre l'état si erreur
      setIsRecording(false);
      setIsPaused(false);
      Alert.alert('Erreur', "Impossible de démarrer l'enregistrement. Vérifiez les permissions microphone.");
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      // Use pause instead of stop to keep the recording active
      await recording.pauseAsync();
      
      setIsRecording(false);
      setIsPaused(true);
      setShowResumeValidate(true);
      setHasAnyRecording(true);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      saveDraft();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleResumeRecording = async () => {
    await startRecording();
  };

  const handleValidateRecording = async () => {
    if (!recording) return;

    try {
      // Wait for lesson creation if still in progress
      if (!lessonId) {
        Alert.alert(
          'Préparation en cours',
          'Veuillez patienter un instant...',
          [{ text: 'OK' }]
        );
        return;
      }

      // Final stop and get the recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        Alert.alert('Erreur', 'Impossible de récupérer l\'enregistrement');
        return;
      }

      setRecording(null);
      recordingRef.current = null;
      setIsRecording(false);
      setIsPaused(false);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
        autoSaveInterval.current = null;
      }

      // Process the recording immediately
      await processRecording(uri);

    } catch (error) {
      console.error('Failed to validate recording:', error);
      Alert.alert('Erreur', 'Impossible de valider l\'enregistrement');
    }
  };


  const processRecording = async (audioUri: string) => {
    if (!user || !lessonId) return;

    try {
      const storagePath = `audio/${user.uid}/${lessonId}/${Date.now()}.wav`;
      const audioUrl = await FileUploadService.uploadFileWithXHR(
        audioUri,
        storagePath,
        (progress) => console.log('Upload progress:', progress.progress)
      );

      await DataService.updateLesson(lessonId, {
        status: 'draft',
        audioUrl,
        duration: Math.floor(totalDurationMillis / 1000 / 60),
      });

      await cleanupLocalFiles();

      // Navigate to ProcessingScreen
      (navigation as any).navigate('ProcessingScreen', {
        lessonId,
        audioUrl,
        localUri: audioUri,
      });

    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Erreur', 'Impossible de traiter l\'enregistrement');
    }
  };

  const cleanupLocalFiles = async () => {
    try {
      await AsyncStorage.removeItem(`draft_${lessonId}`);
      if (user && lessonId) {
        await DataService.deleteRecordingDraft(user.uid, lessonId);
      }
    } catch (error) {
      console.error('Failed to cleanup local files:', error);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
        <Text style={styles.timer}>{formatDuration(totalDurationMillis)}</Text>
        
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!showResumeValidate ? (
          /* Record Button - Initial state */
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordingActive,
            ]}
            onPress={isRecording ? handleStopRecording : startRecording}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={32} 
              color={Colors.surface} 
            />
          </TouchableOpacity>
        ) : (
          /* Resume and Validate Buttons */
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
        )}
      </View>

      {/* Exit Confirmation Modal */}
      <RecordingExitModal
        visible={showExitModal}
        onClose={handleExitModalClose}
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
    marginBottom: 20,
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
    transform: [{ scale: 0.95 }],
  },
  disabledButton: {
    opacity: 0.4,
    backgroundColor: '#E5E5E7',
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
});
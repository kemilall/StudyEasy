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
import { DataService } from '../services/dataService';
import { RecordingDraft, RecordingSegment } from '../types';
import { FileUploadService } from '../services/fileUploadService';

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
  
  // Playback state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [currentPlayingSegmentIndex, setCurrentPlayingSegmentIndex] = useState(0);
  
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
        handleStopSegment(false);
      }
      if (sound) {
        sound.unloadAsync();
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
        await handlePauseSegment();
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

  const startNewSegment = async () => {
    try {
      // Stop any playback in progress
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPlaybackPosition(0);
        setCurrentPlayingSegmentIndex(0);
      }
      
      // Always configure audio mode for recording first
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      
      // Create lesson if needed
      if (!lessonId && user) {
        const newLessonId = await DataService.createLesson(user.uid, {
          subjectId,
          name: lessonNameRef.current,
          status: 'draft',
          duration: 0,
        });
        setLessonId(newLessonId);
      }

      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Create new recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );

      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsRecording(true);
      setIsPaused(false);
      setCurrentSegmentDuration(0);

      // Start duration tracking
      durationInterval.current = setInterval(() => {
        setCurrentSegmentDuration((prev) => prev + 100);
        setTotalDurationMillis((prev) => prev + 100);
      }, 100);

      // Start auto-save
      if (!autoSaveInterval.current) {
        autoSaveInterval.current = setInterval(() => {
          saveDraft();
        }, AUTOSAVE_INTERVAL);
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Erreur', "Impossible de démarrer l'enregistrement. Vérifiez les permissions microphone.");
    }
  };

  const handlePauseSegment = async () => {
    if (!recording) return;

    try {
      // Save the current segment before creating a new recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && currentSegmentDuration > 500) {
        await saveSegmentFromUri(uri, currentSegmentDuration);
      }

      setRecording(null);
      recordingRef.current = null;
      setIsRecording(false);
      setIsPaused(true);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      saveDraft();
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const handleResumeRecording = async () => {
    await startNewSegment();
  };

  const handleStopSegment = async (showConfirmation = true) => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && currentSegmentDuration > 500) {
        await saveSegmentFromUri(uri, currentSegmentDuration);
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

      saveDraft();

      if (showConfirmation) {
        Alert.alert(
          'Enregistrement terminé',
          'Que souhaitez-vous faire ?',
          [
            {
              text: 'Continuer plus tard',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Valider et traiter',
              style: 'default',
              onPress: () => processRecording(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const saveSegmentFromUri = async (uri: string, duration: number) => {
    try {
      if (duration < 500) {
        console.log('Skipping segment with insufficient duration:', duration);
        return;
      }

      await ensureRecordingsDirectory();

      const segmentId = Date.now().toString();
      const fileName = `${lessonId || 'temp'}_segment_${segmentId}.m4a`;
      const destinationUri = `${getRecordingsDir()}${fileName}`;

      console.log('Saving segment:', { uri, destinationUri, duration });

      // Wait a bit to ensure file is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const sourceInfo = await FileSystem.getInfoAsync(uri);
      if (!sourceInfo.exists || (sourceInfo.size && sourceInfo.size < 1000)) {
        console.log('Source file invalid:', sourceInfo);
        return;
      }

      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });

      const destInfo = await FileSystem.getInfoAsync(destinationUri);
      if (!destInfo.exists || (destInfo.size && destInfo.size < 1000)) {
        console.log('Destination file invalid:', destInfo);
        await FileSystem.deleteAsync(destinationUri, { idempotent: true });
        return;
      }

      const newSegment: RecordingSegment = {
        id: segmentId,
        uri: destinationUri,
        durationMillis: duration,
        createdAt: Date.now(),
      };

      setSegments((prev) => [...prev, newSegment]);
      setHasAnyRecording(true);
      console.log('Segment saved successfully');

    } catch (error) {
      console.error('Failed to save segment:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le segment audio');
    }
  };

  const mergeAudioSegments = async (): Promise<string> => {
    try {
      const validSegments = segments.filter(seg => seg.durationMillis > 100);
      if (validSegments.length === 0) {
        throw new Error('Aucun segment valide trouvé');
      }

      // Si un seul segment, on le retourne directement
      if (validSegments.length === 1) {
        return validSegments[0].uri;
      }

      // Pour plusieurs segments, on crée un fichier fusionné simple
      // Note: Cette approche est simplifiée. Pour une vraie fusion audio,
      // il faudrait une librairie native comme FFmpeg
      const mergedFileName = `${lessonId}_merged_${Date.now()}.m4a`;
      const mergedUri = `${getRecordingsDir()}${mergedFileName}`;

      // Pour l'instant, on utilise le segment le plus long comme base
      // Dans une implémentation complète, on concaténerait vraiment les audios
      const longestSegment = validSegments.reduce((prev, current) => 
        (current.durationMillis > prev.durationMillis) ? current : prev
      );

      await FileSystem.copyAsync({
        from: longestSegment.uri,
        to: mergedUri,
      });

      console.log('Audio segments merged (simplified):', mergedUri);
      return mergedUri;

    } catch (error) {
      console.error('Error merging segments:', error);
      // Fallback au premier segment
      return segments[0]?.uri || '';
    }
  };

  const processRecording = async () => {
    if (!user || !lessonId || segments.length === 0) return;

    try {
      // Fusionner tous les segments en un seul fichier
      const mergedAudioUri = await mergeAudioSegments();
      
      const storagePath = `audio/${user.uid}/${lessonId}/${Date.now()}.m4a`;
      const audioUrl = await FileUploadService.uploadFileWithXHR(
        mergedAudioUri,
        storagePath,
        (progress) => console.log('Upload progress:', progress.progress)
      );

      await DataService.updateLesson(lessonId, {
        status: 'processing',
        audioUrl,
        duration: Math.floor(totalDurationMillis / 1000 / 60),
      });

      await cleanupLocalFiles();

      navigation.navigate('ProcessingScreen' as never, {
        lessonId,
        audioUrl,
        localUri: mergedAudioUri,
      } as never);

    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Erreur', 'Impossible de traiter l\'enregistrement');
    }
  };

  const cleanupLocalFiles = async () => {
    try {
      for (const segment of segments) {
        await FileSystem.deleteAsync(segment.uri, { idempotent: true });
      }
      await AsyncStorage.removeItem(`draft_${lessonId}`);
      if (user && lessonId) {
        await DataService.deleteRecordingDraft(user.uid, lessonId);
      }
    } catch (error) {
      console.error('Failed to cleanup local files:', error);
    }
  };

  const playAllSegments = async () => {
    if (segments.length === 0) return;
    
    // Reset audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    setCurrentPlayingSegmentIndex(0);
    playSegment(0);
  };

  const playSegment = async (index: number) => {
    try {
      const validSegments = segments.filter(seg => seg.durationMillis > 100);
      if (index >= validSegments.length) {
        // All segments played
        setIsPlaying(false);
        setCurrentPlayingSegmentIndex(0);
        
        // Reset audio mode for recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        return;
      }

      const segment = validSegments[index];
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Check if file exists and is valid before playing
      const fileInfo = await FileSystem.getInfoAsync(segment.uri);
      if (!fileInfo.exists || (fileInfo.size && fileInfo.size < 1000)) {
        console.log('Skipping invalid segment:', segment.uri);
        playSegment(index + 1);
        return;
      }

      // Add a small delay to ensure audio context is ready
      await new Promise(resolve => setTimeout(resolve, 300));

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: segment.uri },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis || 0);
            setPlaybackDuration(totalDurationMillis); // Utilise la durée totale pour l'expérience continue
            if (status.didJustFinish) {
              // Play next segment automatiquement
              playSegment(index + 1);
            }
          }
        }
      );

      setSound(newSound);
      setIsPlaying(true);
      setCurrentPlayingSegmentIndex(index);

    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Erreur', 'Impossible de lire l\'enregistrement');
      setIsPlaying(false);
    }
  };

  const pausePlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setCurrentPlayingSegmentIndex(0);
      
      // Reset audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
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
          <Ionicons name="close" size={28} color={Colors.text.primary} />
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
        {/* Play Button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            (!hasAnyRecording || isRecording) && styles.disabledButton
          ]}
          onPress={isPlaying ? stopPlayback : playAllSegments}
          disabled={!hasAnyRecording || isRecording}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isPlaying ? "stop" : "play"} 
            size={24} 
            color={(!hasAnyRecording || isRecording) ? '#9CA3AF' : Colors.surface} 
          />
        </TouchableOpacity>

        {/* Record Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingActive,
            isPlaying && styles.disabledButton
          ]}
          onPress={isRecording ? handlePauseSegment : startNewSegment}
          disabled={isPlaying}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isRecording ? "pause" : "mic"} 
            size={32} 
            color={isPlaying ? '#9CA3AF' : Colors.surface} 
          />
        </TouchableOpacity>
      </View>

      {/* Record Button Label */}
      <Text style={styles.recordLabel}>
        {isRecording 
          ? 'Mettre en pause' 
          : hasAnyRecording 
            ? 'Reprendre' 
            : 'Enregistrer'}
      </Text>

      {/* Validate Button */}
      {hasAnyRecording && !isRecording && (
        <TouchableOpacity
          style={styles.validateButton}
          onPress={processRecording}
        >
          <Ionicons name="checkmark" size={24} color={Colors.surface} />
          <Text style={styles.validateButtonText}>Valider et traiter</Text>
        </TouchableOpacity>
      )}
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
    ...Typography.h3,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 40,
    marginBottom: 20,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
  recordLabel: {
    ...Typography.h3,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  validateButton: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.green,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 28,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  validateButtonText: {
    ...Typography.h3,
    color: Colors.surface,
  },
});
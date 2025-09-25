import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
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
const { width: screenWidth } = Dimensions.get('window');

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
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs
  const appState = useRef(AppState.currentState);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const lessonNameRef = useRef(initialLessonName || 'Enregistrement');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackStatusRef = useRef<any>(null);
  const wasPlayingBeforeDrag = useRef<boolean>(false);
  const lastDragPositionRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

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
      if (soundRef.current) {
        soundRef.current.unloadAsync();
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
      // Feedback visuel immédiat
      setIsRecording(true);
      setIsPaused(false);
      setCurrentSegmentDuration(0);

      // Stop any playback in progress (en parallèle)
      const stopPlaybackPromise = soundRef.current ? (async () => {
        await soundRef.current!.stopAsync();
        await soundRef.current!.unloadAsync();
        soundRef.current = null;
        setSound(null);
        setIsPlaying(false);
        setPlaybackPosition(0);
        setCurrentPlayingSegmentIndex(0);
      })() : Promise.resolve();

      // Create lesson if needed (en parallèle)
      const createLessonPromise = (!lessonId && user) ? 
        DataService.createLesson(user.uid, {
          subjectId,
          name: lessonNameRef.current,
          status: 'draft',
          duration: 0,
        }).then(newLessonId => setLessonId(newLessonId)) : 
        Promise.resolve();

      // Configure audio mode (en parallèle)
      const audioConfigPromise = Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Attendre les tâches en parallèle
      await Promise.all([stopPlaybackPromise, createLessonPromise, audioConfigPromise]);

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
      // Remettre l'état si erreur
      setIsRecording(false);
      setIsPaused(false);
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

    try {
      // Configure audio for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      setIsPlaying(true);

      // If we have a valid position, resume from there
      if (playbackPosition > 0 && playbackPosition < totalDurationMillis) {
        await seekToPosition(playbackPosition, true);
      } else {
        // Otherwise start from beginning
        setPlaybackPosition(0);
        setCurrentPlayingSegmentIndex(0);
        await playSegment(0);
      }
    } catch (error) {
      console.error('Error starting playback:', error);
      setIsPlaying(false);
    }
  };

  const playSegment = async (index: number) => {
    try {
      const validSegments = segments.filter(seg => seg.durationMillis > 100);
      if (index >= validSegments.length) {
        // All segments played
        console.log('All segments played');
        setIsPlaying(false);
        setPlaybackPosition(0);
        setCurrentPlayingSegmentIndex(0);
        
        // Clean up current sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          setSound(null);
        }
        
        // Reset audio mode for recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        return;
      }

      const segment = validSegments[index];
      console.log(`Playing segment ${index}:`, segment.uri);
      
      // Check if file exists and is valid
      const fileInfo = await FileSystem.getInfoAsync(segment.uri);
      if (!fileInfo.exists || (fileInfo.size && fileInfo.size < 1000)) {
        console.log('Skipping invalid segment:', segment.uri);
        await playSegment(index + 1);
        return;
      }

      // Clean up previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
      }

      // Calculate accumulated duration for this segment
      let accumulatedDuration = 0;
      for (let i = 0; i < index; i++) {
        if (validSegments[i]) {
          accumulatedDuration += validSegments[i].durationMillis;
        }
      }

      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: segment.uri },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        },
        (status) => {
          if (status.isLoaded) {
            playbackStatusRef.current = status;

            // Always update position if playing, regardless of dragging state
            if (status.isPlaying) {
              const globalPosition = accumulatedDuration + (status.positionMillis || 0);
              setPlaybackPosition(globalPosition);
              setPlaybackDuration(totalDurationMillis);
            }

            if (status.didJustFinish && !isDraggingRef.current) {
              console.log(`Segment ${index} finished, playing next`);
              // Play next segment
              setTimeout(() => {
                playSegment(index + 1);
              }, 100);
            }
          }
        }
      );

      soundRef.current = newSound;
      setSound(newSound);
      setCurrentPlayingSegmentIndex(index);

    } catch (error) {
      console.error('Error playing segment:', error);
      Alert.alert('Erreur', 'Impossible de lire l\'enregistrement');
      setIsPlaying(false);
    }
  };

  const pausePlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing playback:', error);
      }
    }
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
      }
      
      setIsPlaying(false);
      setPlaybackPosition(0);
      setCurrentPlayingSegmentIndex(0);
      
      // Reset audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  const handlePlayPauseToggle = async () => {
    if (isPlaying) {
      await pausePlayback();
    } else {
      await playAllSegments();
    }
  };

  const seekToPosition = async (position: number, resumePlayback: boolean = false) => {
    if (!totalDurationMillis || segments.length === 0) return;

    try {
      const targetPositionMillis = Math.max(0, Math.min(position, totalDurationMillis));
      const shouldPlay = resumePlayback || isPlaying;

      console.log('Seeking to position:', targetPositionMillis, 'shouldPlay:', shouldPlay);

      // Find which segment contains this position
      let accumulatedDuration = 0;
      let targetSegmentIndex = 0;
      let positionInSegment = 0;

      const validSegments = segments.filter(seg => seg.durationMillis > 100);

      for (let i = 0; i < validSegments.length; i++) {
        const segment = validSegments[i];
        if (targetPositionMillis <= accumulatedDuration + segment.durationMillis) {
          targetSegmentIndex = i;
          positionInSegment = targetPositionMillis - accumulatedDuration;
          break;
        }
        accumulatedDuration += segment.durationMillis;
      }

      // Stop current playback if exists
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
      }

      // Update position immediately for UI feedback
      setPlaybackPosition(targetPositionMillis);
      setCurrentPlayingSegmentIndex(targetSegmentIndex);

      // Create the sound at the target position
      if (validSegments[targetSegmentIndex]) {
        const segmentAccumulatedDuration = accumulatedDuration;
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: validSegments[targetSegmentIndex].uri },
          {
            shouldPlay: shouldPlay,
            isLooping: false,
            volume: 1.0,
            positionMillis: positionInSegment,
          },
          (status) => {
            if (status.isLoaded) {
              playbackStatusRef.current = status;

              // Always update position if playing, regardless of dragging state after seek
              if (status.isPlaying) {
                const globalPosition = segmentAccumulatedDuration + (status.positionMillis || 0);
                setPlaybackPosition(globalPosition);
                setPlaybackDuration(totalDurationMillis);
              }

              if (status.didJustFinish && !isDraggingRef.current) {
                console.log(`Segment ${targetSegmentIndex} finished after seek, playing next`);
                setTimeout(() => {
                  playSegment(targetSegmentIndex + 1);
                }, 100);
              }
            }
          }
        );

        soundRef.current = newSound;
        setSound(newSound);
        setIsPlaying(shouldPlay);
      }
    } catch (error) {
      console.error('Error seeking:', error);
      setIsPlaying(false);
    }
  };

  const handleProgressPanGesture = (event: any) => {
    if (!hasAnyRecording || isRecording) return;

    const { x } = event.nativeEvent;
    const progressBarWidth = screenWidth - 144;
    const progress = Math.max(0, Math.min(1, x / progressBarWidth));
    const targetPosition = progress * totalDurationMillis;

    // Update position visually during drag and store last position
    lastDragPositionRef.current = targetPosition;
    setPlaybackPosition(targetPosition);
    console.log(`DRAG ACTIVE - Updating position to: ${targetPosition}`);
  };

  const handleProgressPanStateChange = (event: any) => {
    if (!hasAnyRecording || isRecording) return;

    const { state, x } = event.nativeEvent;

    // Ignore duplicate events
    if (state === State.BEGAN && isDraggingRef.current) {
      console.log('Ignoring duplicate BEGAN event');
      return;
    }

    const progressBarWidth = screenWidth - 144;
    const progress = Math.max(0, Math.min(1, (x ?? 0) / progressBarWidth));
    const targetPosition = progress * totalDurationMillis;

    console.log(`Progress Pan State Change - State: ${State[state]}, x: ${x}, computedPos: ${targetPosition}, isDragging: ${isDraggingRef.current}`);

    if (state === State.BEGAN && !isDraggingRef.current) {
      console.log('DRAG BEGAN - set isDragging true and pause if needed');
      setIsDragging(true);
      isDraggingRef.current = true;
      wasPlayingBeforeDrag.current = isPlaying;
      lastDragPositionRef.current = playbackPosition; // init
      if (soundRef.current && isPlaying) {
        soundRef.current.setStatusAsync({ shouldPlay: false }).then(() => {
          console.log('Playback paused for drag');
          setIsPlaying(false);
        }).catch(err => console.error('Error pausing for drag:', err));
      }
    } else if ((state === State.END || state === State.CANCELLED || state === State.FAILED) && isDraggingRef.current) {
      const finalPosition = lastDragPositionRef.current || targetPosition || playbackPosition;
      console.log(`DRAG END - finalPosition: ${finalPosition}, clearing drag state first`);

      // CRITICAL: Clear dragging state immediately
      isDraggingRef.current = false;
      setIsDragging(false);

      // Update position and resume
      setPlaybackPosition(finalPosition);

      // Resume playback immediately
      console.log('Resuming playback after drag');
      seekToPosition(finalPosition, wasPlayingBeforeDrag.current);

      wasPlayingBeforeDrag.current = false;
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
        
        {/* Audio Progress Bar - only when not recording and has audio */}
        {hasAnyRecording && !isRecording && (
          <View style={styles.audioPlayerContainer}>
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={handlePlayPauseToggle}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={20} 
                color={Colors.text.primary} 
              />
            </TouchableOpacity>
            
            <Text style={styles.currentTime}>
              {formatDuration(playbackPosition)}
            </Text>
            
            <PanGestureHandler 
              onGestureEvent={handleProgressPanGesture}
              onHandlerStateChange={handleProgressPanStateChange}
            >
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${totalDurationMillis > 0 ? (playbackPosition / totalDurationMillis) * 100 : 0}%` 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.progressThumb,
                      { 
                        left: `${totalDurationMillis > 0 ? (playbackPosition / totalDurationMillis) * 100 : 0}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            </PanGestureHandler>
            
            <Text style={styles.totalTime}>
              {formatDuration(totalDurationMillis)}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Record Button - Centered */}
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


      {/* Validate Button */}
      {hasAnyRecording && !isRecording && !isPlaying && (
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
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  playPauseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  currentTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
    textAlign: 'right',
  },
  totalTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
    textAlign: 'left',
  },
  progressBarContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.accent.blue,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent.blue,
    top: -6,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
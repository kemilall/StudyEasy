import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
  ImageBackground,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { useAuth } from '../contexts/AuthContext';
import { useRecording } from '../contexts/RecordingContext';
import { DataService } from '../services/dataService';
import { FileUploadService } from '../services/fileUploadService';
import { DoubleConfirmationModal } from '../components/DoubleConfirmationModal';
import { LiveActivityService } from '../services/liveActivityService';

const BackgroundWavesImage = require('../../assets/background_waves.png');

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

  // Pulse animation for recording button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Background decorative waves */}
      <ImageBackground
        source={BackgroundWavesImage}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.06 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: Colors.surfaceAlt,
              justifyContent: 'center',
              alignItems: 'center',
              ...DesignTokens.shadows.sm,
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{
              ...Typography.small,
              color: Colors.textSecondary,
              marginBottom: 2,
            }}>
              {subjectName}
            </Text>
            <Text style={{
              ...Typography.h3,
              color: Colors.textPrimary,
              fontWeight: '700',
            }}>
              {lessonNameRef.current}
            </Text>
          </View>
          
          <View style={{ width: 40 }} />
        </View>

        {/* Timer Section */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 40,
        }}>
          {/* Status Badge */}
          {isRecording && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.danger + '15',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginBottom: 24,
              gap: 8,
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: Colors.danger,
              }} />
              <Text style={{
                ...Typography.small,
                color: Colors.danger,
                fontWeight: '600',
              }}>
                Enregistrement en cours
              </Text>
            </View>
          )}

          {/* Timer Display */}
          <View style={{
            backgroundColor: Colors.surface,
            borderRadius: 24,
            padding: 32,
            marginBottom: 40,
            ...DesignTokens.shadows.md,
            borderWidth: 1,
            borderColor: Colors.border,
            minWidth: 280,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 64,
              fontWeight: '300',
              color: Colors.textPrimary,
              fontVariant: ['tabular-nums'],
              letterSpacing: 2,
            }}>
              {formatDuration(displayDuration)}
            </Text>
          </View>

          {/* Instructions */}
          {!isRecording && !isPaused && (
            <Text style={{
              ...Typography.body,
              color: Colors.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
            }}>
              Appuyez sur le bouton pour commencer l'enregistrement
            </Text>
          )}
        </View>

        {/* Controls Section */}
        <View style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
          paddingBottom: 60,
        }}>
          {!isPaused ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: isRecording ? Colors.warning : Colors.danger,
                  justifyContent: 'center',
                  alignItems: 'center',
                  ...DesignTokens.shadows.lg,
                }}
                onPress={isRecording ? handlePauseRecording : startRecording}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isRecording ? "pause" : "mic"} 
                  size={40} 
                  color={Colors.textOnPrimary} 
                />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={{
              width: '100%',
              alignItems: 'center',
              gap: 24,
            }}>
              <Text style={{
                ...Typography.h3,
                color: Colors.textSecondary,
                marginBottom: 8,
              }}>
                Enregistrement en pause
              </Text>
              
              <View style={{
                flexDirection: 'row',
                gap: 16,
                alignItems: 'center',
              }}>
                <TouchableOpacity
                  onPress={handleResumeRecording}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={DesignTokens.gradients.brand}
                    style={{
                      flexDirection: 'row',
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      minWidth: 140,
                    }}
                  >
                    <Ionicons name="mic" size={24} color={Colors.textOnPrimary} />
                    <Text style={{
                      ...Typography.body,
                      color: Colors.textOnPrimary,
                      fontWeight: '600',
                    }}>
                      Reprendre
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    backgroundColor: Colors.accentGreen,
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    minWidth: 140,
                    ...DesignTokens.shadows.sm,
                  }}
                  onPress={handleValidateRecording}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={24} color={Colors.textOnPrimary} />
                  <Text style={{
                    ...Typography.body,
                    color: Colors.textOnPrimary,
                    fontWeight: '600',
                  }}>
                    Valider
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
                onPress={() => setShowExitModal(true)}
                activeOpacity={0.8}
              >
                <Text style={{
                  ...Typography.body,
                  color: Colors.danger,
                  fontWeight: '600',
                }}>
                  Quitter et supprimer
                </Text>
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
    </View>
  );
};

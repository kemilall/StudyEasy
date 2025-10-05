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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Refs
  const appState = useRef(AppState.currentState);
  const lessonNameRef = useRef(initialLessonName || currentSession?.lessonName || 'Enregistrement');
  const hasCreatedLesson = useRef(false);
  
  // Animation for recording pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
        setHasPermission(false);
        return;
      }
      
      setHasPermission(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
      setHasPermission(false);
    }
  };

  const requestPermission = async () => {
    await setupAudio();
  };

  // Pulse animation for recording button
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

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

  // Permission Gate
  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
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
          imageStyle={{ opacity: 0.08 }}
        />
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            height: 56,
          }}>
            <TouchableOpacity onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={{
              ...Typography.h2,
              color: Colors.textPrimary,
              fontWeight: '600',
            }}>
              Enregistrer un cours
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Permission Content */}
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}>
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              marginBottom: 32,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <LinearGradient
                colors={DesignTokens.gradients.brand}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="mic-outline" size={48} color={Colors.textOnPrimary} />
              </LinearGradient>
            </View>

            <Text style={{
              ...Typography.h1,
              color: Colors.textPrimary,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 12,
              fontSize: 28,
            }}>
              Autoriser le microphone
            </Text>

            <Text style={{
              ...Typography.body,
              color: Colors.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 40,
            }}>
              StudyEasy a besoin d'accéder à votre microphone pour enregistrer vos cours.
            </Text>

            <TouchableOpacity
              onPress={requestPermission}
              style={{ width: '100%', maxWidth: 300 }}
            >
              <LinearGradient
                colors={DesignTokens.gradients.brand}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  ...DesignTokens.shadows.sm,
                }}
              >
                <Text style={{
                  ...Typography.body,
                  color: Colors.textOnPrimary,
                  fontWeight: '600',
                  fontSize: 16,
                }}>
                  Autoriser le microphone
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
        imageStyle={{ opacity: 0.08 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          height: 56,
        }}>
          <TouchableOpacity onPress={handleBackPress}>
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
              ...Typography.body,
              color: Colors.textPrimary,
              fontWeight: '600',
            }}>
              {lessonNameRef.current}
            </Text>
          </View>
          
          <TouchableOpacity>
            <Ionicons name="help-circle-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={{ flex: 1, justifyContent: 'space-between', paddingBottom: 48 }}>
          {/* Timer Section */}
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {!isRecording && !isPaused ? (
              // Idle State
              <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
                <View style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: Colors.surfaceAlt,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 32,
                  ...DesignTokens.shadows.sm,
                }}>
                  <Ionicons name="mic" size={48} color={Colors.primaryBlue} />
                </View>
                
                <Text style={{
                  ...Typography.h1,
                  color: Colors.textPrimary,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 12,
                  fontSize: 28,
                }}>
                  Prêt à enregistrer ?
                </Text>
                
                <Text style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 24,
                }}>
                  Appuyez sur le bouton pour commencer l'enregistrement
                </Text>
              </View>
            ) : (
              // Recording/Paused State - Timer
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 64,
                  fontWeight: '300',
                  color: Colors.textPrimary,
                  fontVariant: ['tabular-nums'],
                  letterSpacing: 2,
                  marginBottom: 16,
                }}>
                  {formatDuration(displayDuration)}
                </Text>
                
                {isPaused && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.warning + '20',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    gap: 8,
                  }}>
                    <Ionicons name="pause-circle" size={20} color={Colors.warning} />
                    <Text style={{
                      ...Typography.body,
                      color: Colors.warning,
                      fontWeight: '600',
                    }}>
                      En pause
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Controls */}
          <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            {!isPaused ? (
              // Recording or Idle Controls
              <View style={{ alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
                  <TouchableOpacity
                    onPress={isRecording ? handlePauseRecording : startRecording}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isRecording ? [Colors.danger, '#FF8566'] : DesignTokens.gradients.brand}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                        ...DesignTokens.shadows.lg,
                      }}
                    >
                      <Ionicons
                        name={isRecording ? "pause" : "mic"}
                        size={40}
                        color={Colors.textOnPrimary}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
                
                {isRecording && (
                  <Text style={{
                    ...Typography.small,
                    color: Colors.textSecondary,
                    marginTop: 20,
                    textAlign: 'center',
                  }}>
                    Appuyez pour mettre en pause
                  </Text>
                )}
              </View>
            ) : (
              // Paused Controls
              <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12, width: '100%', maxWidth: 400 }}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={handleResumeRecording}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={DesignTokens.gradients.brand}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 16,
                        borderRadius: 16,
                        gap: 8,
                        ...DesignTokens.shadows.sm,
                      }}
                    >
                      <Ionicons name="play" size={20} color={Colors.textOnPrimary} />
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
                    style={{ flex: 1 }}
                    onPress={handleValidateRecording}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 16,
                      borderRadius: 16,
                      gap: 8,
                      backgroundColor: Colors.accentGreen,
                      ...DesignTokens.shadows.sm,
                    }}>
                      <Ionicons name="checkmark" size={20} color={Colors.textOnPrimary} />
                      <Text style={{
                        ...Typography.body,
                        color: Colors.textOnPrimary,
                        fontWeight: '600',
                      }}>
                        Valider
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  onPress={() => setShowExitModal(true)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                  }}
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
        </View>
      </SafeAreaView>

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
    </View>
  );
};

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useRecording } from '../contexts/RecordingContext';

export const FloatingRecordingBubble: React.FC = () => {
  const navigation = useNavigation();
  const { currentSession, isRecording, isPaused, isOnRecordingScreen } = useRecording();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation when recording
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

  // Don't show if no session or if already on recording screen
  if (!currentSession || isOnRecordingScreen) {
    return null;
  }

  const handlePress = () => {
    (navigation as any).navigate('RecordingStudio', {
      subjectId: currentSession.subjectId,
      subjectName: currentSession.subjectName,
      subjectColor: currentSession.subjectColor,
      lessonId: currentSession.lessonId,
      initialLessonName: currentSession.lessonName,
    });
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
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.bubble,
          isRecording && styles.recordingBubble,
          isPaused && styles.pausedBubble,
          isRecording && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name={isRecording ? "mic" : "pause"} 
            size={20} 
            color={Colors.surface} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.lessonName} numberOfLines={1}>
            {currentSession.lessonName}
          </Text>
          <Text style={styles.duration}>
            {formatDuration(currentSession.durationMillis)}
          </Text>
        </View>
        {isRecording && (
          <View style={styles.recordingIndicator} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.blue,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 200,
  },
  recordingBubble: {
    backgroundColor: Colors.accent.red,
  },
  pausedBubble: {
    backgroundColor: Colors.accent.orange,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  lessonName: {
    ...Typography.caption1,
    color: Colors.surface,
    fontWeight: '600',
    marginBottom: 2,
  },
  duration: {
    ...Typography.caption2,
    color: Colors.surface,
    opacity: 0.9,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    marginLeft: 8,
  },
});

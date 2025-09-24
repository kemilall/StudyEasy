import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson } from '../types';

export const TranscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId } = route.params as { lessonId: string };
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !lessonId) return;

    const loadLesson = async () => {
      try {
        const lessonData = await DataService.getLesson(lessonId);
        setLesson(lessonData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading lesson:', error);
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [user, lessonId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !lesson.transcription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.errorTitle}>Transcription non disponible</Text>
          <Text style={styles.errorSubtitle}>
            La transcription de ce chapitre n'est pas encore prête ou n'existe pas
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transcription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonName}>{lesson.name}</Text>
          {lesson.duration > 0 && (
            <Text style={styles.lessonDuration}>{lesson.duration} minutes</Text>
          )}
        </View>

        <View style={styles.transcriptionCard}>
          <Text style={styles.transcriptionText}>{lesson.transcription}</Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  errorSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  lessonInfo: {
    marginBottom: 24,
  },
  lessonName: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  lessonDuration: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  transcriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
  },
  transcriptionText: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 28,
  },
});
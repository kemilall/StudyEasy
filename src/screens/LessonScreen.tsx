import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ChapterCard } from '../components/ChapterCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson, Chapter } from '../types';

export const LessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId } = route.params as { lessonId: string };
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !lessonId) return;

    // Get lesson data
    const loadLesson = async () => {
      try {
        const lessonData = await DataService.getLesson(lessonId);
        setLesson(lessonData);
      } catch (error) {
        console.error('Error loading lesson:', error);
      }
    };

    // Subscribe to chapters
    const unsubscribe = DataService.subscribeToLessonChapters(lessonId, (lessonChapters) => {
      setChapters(lessonChapters);
      setIsLoading(false);
    });

    loadLesson();

    return () => unsubscribe();
  }, [user, lessonId]);

  const renderChapter = ({ item }: { item: Chapter }) => (
    <ChapterCard
      chapter={item}
      onPress={() => navigation.navigate('Chapter' as never, { chapterId: item.id })}
    />
  );

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.lessonName}>{lesson.name}</Text>
          <Text style={styles.lessonStats}>
            {lesson.chaptersCount} chapitres • {lesson.completedChapters} terminés
          </Text>
          {lesson.description && (
            <Text style={styles.lessonDescription}>{lesson.description}</Text>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chapitres</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AudioImport' as never, { 
              lessonId,
              chapterName: `Chapitre ${chapters.length + 1}`
            })}
          >
            <Ionicons name="add" size={20} color={Colors.accent.blue} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.blue} />
          </View>
        ) : chapters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Aucun chapitre</Text>
            <Text style={styles.emptySubtitle}>Importez un audio ou un texte pour créer votre premier chapitre</Text>
            <TouchableOpacity 
              style={styles.createChapterButton}
              onPress={() => navigation.navigate('AudioImport' as never, { 
                lessonId,
                chapterName: 'Chapitre 1'
              })}
            >
              <Text style={styles.createChapterButtonText}>Importer un audio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={chapters}
            renderItem={renderChapter}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chaptersList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  lessonName: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  lessonStats: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  lessonDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.blue + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addButtonText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  chaptersList: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createChapterButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createChapterButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
});
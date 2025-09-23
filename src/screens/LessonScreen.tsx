import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson, Chapter, Subject } from '../types';
import { ChapterCard } from '../components/ChapterCard';

export const LessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId } = route.params as { lessonId: string };
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user || !lessonId) return;

    // Get lesson data
    const loadLesson = async () => {
      try {
        const lessonData = await DataService.getLesson(lessonId);
        setLesson(lessonData);
        
        // Load subject data
        if (lessonData) {
          const subjects = await DataService.getUserSubjects(user.uid);
          const foundSubject = subjects.find(s => s.id === lessonData.subjectId);
          setSubject(foundSubject || null);
        }
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

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      await DataService.deleteChapter(chapterId);
    } catch (error) {
      console.error('Error deleting chapter:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le chapitre. Veuillez réessayer.');
    }
  };

  const renderChapter = (chapter: Chapter, index: number) => (
    <ChapterCard
      key={chapter.id}
      chapter={chapter}
      onPress={() => (navigation as any).navigate('Chapter', { chapterId: chapter.id })}
      onUpload={() => (navigation as any).navigate('AudioImport', { 
        lessonId,
        chapterId: chapter.id
      })}
      onDelete={() => handleDeleteChapter(chapter.id)}
      editMode={editMode}
    />
  );

  if (!lesson || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = lesson.chaptersCount ? Math.round(((lesson.completedChapters || 0) / lesson.chaptersCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            {subject && (
              <View style={[styles.subjectBadge, { backgroundColor: subject.color + '15' }]}>
                <Text style={[styles.subjectBadgeText, { color: subject.color }]}>
                  {subject.name}
                </Text>
              </View>
            )}
            <Text style={styles.lessonName}>{lesson.name}</Text>
            {lesson.description && (
              <Text style={styles.lessonDescription}>{lesson.description}</Text>
            )}
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression</Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: subject?.color || Colors.accent.blue
                }
              ]} 
            />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{lesson.chaptersCount || 0}</Text>
              <Text style={styles.progressStatLabel}>Leçons</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{lesson.completedChapters || 0}</Text>
              <Text style={styles.progressStatLabel}>Terminés</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{lesson.duration || 0}</Text>
              <Text style={styles.progressStatLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('AudioImport', { 
              lessonId,
              chapterName: `Chapitre ${chapters.length + 1}`
            })}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="mic" size={20} color={Colors.accent.red} />
            </View>
            <Text style={styles.actionButtonText}>Enregistrer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('AudioImport', { 
              lessonId,
              chapterName: `Chapitre ${chapters.length + 1}`
            })}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="volume-high" size={20} color={Colors.accent.blue} />
            </View>
            <Text style={styles.actionButtonText}>Importer audio</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('CreateChapter', { lessonId })}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="document-text" size={20} color={Colors.accent.green} />
            </View>
            <Text style={styles.actionButtonText}>Importer texte</Text>
          </TouchableOpacity>
        </View>

        {/* Chapters Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leçons</Text>
            {chapters.length > 0 && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditMode(!editMode)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={editMode ? "checkmark" : "create-outline"} 
                  size={18} 
                  color={editMode ? Colors.accent.green : Colors.accent.blue} 
                />
                <Text style={[styles.editButtonText, { color: editMode ? Colors.accent.green : Colors.accent.blue }]}>
                  {editMode ? 'OK' : 'Modifier'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {chapters.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-open-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>Aucune leçon</Text>
              <Text style={styles.emptySubtitle}>
                Commencez par enregistrer ou importer votre première leçon
              </Text>
            </View>
          ) : (
            <View style={styles.chaptersContainer}>
              {chapters.map((chapter, index) => renderChapter(chapter, index))}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
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
  subjectBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  subjectBadgeText: {
    ...Typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lessonName: {
    ...Typography.title1,
    color: Colors.text.primary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  lessonDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  progressPercent: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    ...Typography.title3,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  progressStatLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  progressDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    ...Typography.caption1,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 4,
  },
  editButtonText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  chaptersContainer: {
    gap: 12,
  },
  chapterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  chapterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chapterNumberText: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
  },
  completedBadge: {
    backgroundColor: Colors.accent.green + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
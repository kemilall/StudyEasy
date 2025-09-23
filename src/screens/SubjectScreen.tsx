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
import { Subject, Lesson, Chapter } from '../types';
import { LessonCard } from '../components/LessonCard';

export const SubjectScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { subjectId } = route.params as { subjectId: string };
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [recentChapters, setRecentChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user || !subjectId) return;

    // Get subject data
    const loadSubject = async () => {
      try {
        const subjects = await DataService.getUserSubjects(user.uid);
        const foundSubject = subjects.find(s => s.id === subjectId);
        setSubject(foundSubject || null);
      } catch (error) {
        console.error('Error loading subject:', error);
      }
    };

    // Subscribe to lessons
    const unsubscribe = DataService.subscribeToSubjectLessons(subjectId, (subjectLessons) => {
      setLessons(subjectLessons);
      setIsLoading(false);
      
      // Load recent chapters from these lessons
      loadRecentChapters(subjectLessons);
    });

    loadSubject();

    return () => unsubscribe();
  }, [user, subjectId]);

  const loadRecentChapters = async (lessonsList: Lesson[]) => {
    try {
      const allChapters: Chapter[] = [];
      
      for (const lesson of lessonsList.slice(0, 3)) {
        const chapters = await DataService.getLessonChapters(lesson.id);
        allChapters.push(...chapters.slice(0, 2));
      }
      
      setRecentChapters(allChapters.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent chapters:', error);
    }
  };

  const getSubjectIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('math')) return 'calculator-outline';
    if (lowercaseName.includes('physi')) return 'planet-outline';
    if (lowercaseName.includes('chimi')) return 'flask-outline';
    if (lowercaseName.includes('histoi')) return 'library-outline';
    if (lowercaseName.includes('géo')) return 'earth-outline';
    if (lowercaseName.includes('bio')) return 'leaf-outline';
    if (lowercaseName.includes('info')) return 'code-slash-outline';
    if (lowercaseName.includes('anglais') || lowercaseName.includes('english')) return 'language-outline';
    return 'book-outline';
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await DataService.deleteLesson(lessonId);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la leçon. Veuillez réessayer.');
    }
  };

  const renderLesson = (lesson: Lesson) => (
    <LessonCard
      key={lesson.id}
      lesson={lesson}
      onPress={() => (navigation as any).navigate('Lesson', { lessonId: lesson.id })}
      onDelete={() => handleDeleteLesson(lesson.id)}
      editMode={editMode}
    />
  );

  const renderRecentChapter = (chapter: Chapter) => (
    <TouchableOpacity
      key={chapter.id}
      style={styles.chapterCard}
      activeOpacity={0.7}
      onPress={() => (navigation as any).navigate('Chapter', { chapterId: chapter.id })}
    >
      <View style={[styles.chapterIndicator, { backgroundColor: subject?.color || Colors.accent.blue }]} />
      <Text style={styles.chapterName} numberOfLines={2}>{chapter.name}</Text>
      <View style={styles.chapterMeta}>
        <Ionicons name="time-outline" size={12} color={Colors.text.tertiary} />
        <Text style={styles.chapterDuration}>{chapter.duration || 45} min</Text>
      </View>
    </TouchableOpacity>
  );

  if (!subject || isLoading) {
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
            <View style={[styles.subjectIcon, { backgroundColor: subject.color + '15' }]}>
              <Ionicons 
                name={getSubjectIcon(subject.name) as any} 
                size={40} 
                color={subject.color} 
              />
            </View>
            <Text style={styles.subjectName}>{subject.name}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{subject.lessonsCount || 0}</Text>
                <Text style={styles.statLabel}>Chapitres</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{subject.completedLessons || 0}</Text>
                <Text style={styles.statLabel}>Terminées</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {subject.lessonsCount ? Math.round(((subject.completedLessons || 0) / subject.lessonsCount) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Progrès</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Chapters */}
        {recentChapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leçons récentes</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chaptersScroll}
            >
              {recentChapters.map(renderRecentChapter)}
            </ScrollView>
          </View>
        )}

        {/* Lessons Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chapitres</Text>
            <View style={styles.headerActions}>
              {lessons.length > 0 && (
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
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => (navigation as any).navigate('CreateLesson', { subjectId })}
              >
                <Ionicons name="add-circle" size={20} color={Colors.accent.blue} />
                <Text style={styles.addButtonText}>Nouvelle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {lessons.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>Aucun chapitre</Text>
              <Text style={styles.emptySubtitle}>
                Créez votre premier chapitre pour cette matière
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => (navigation as any).navigate('CreateLesson', { subjectId })}
              >
                <Text style={styles.createButtonText}>Créer un chapitre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.lessonsContainer}>
              {lessons.map(renderLesson)}
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
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  subjectIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectName: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    ...Typography.footnote,
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  chaptersScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  chapterCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  chapterIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  chapterName: {
    ...Typography.footnote,
    color: Colors.text.primary,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  chapterDuration: {
    ...Typography.caption2,
    color: Colors.text.tertiary,
  },
  lessonsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  lessonCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonContent: {
    flex: 1,
    marginRight: 12,
  },
  lessonHeader: {
    marginBottom: 12,
  },
  lessonName: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  lessonStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonChapters: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  lessonProgress: {
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...Typography.caption2,
    color: Colors.text.secondary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    marginHorizontal: 20,
    alignItems: 'center',
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '700',
  },
});
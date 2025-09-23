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
import { LessonCard } from '../components/LessonCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Subject, Lesson } from '../types';

export const SubjectScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { subjectId } = route.params as { subjectId: string };
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    });

    loadSubject();

    return () => unsubscribe();
  }, [user, subjectId]);

  const renderLesson = ({ item }: { item: Lesson }) => (
    <LessonCard
      lesson={item}
      onPress={() => navigation.navigate('Lesson' as never, { lessonId: item.id })}
    />
  );

  if (!subject) {
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
      <View style={[styles.header, { backgroundColor: subject.color + '15' }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.subjectIcon, { backgroundColor: subject.color + '25' }]}>
            <Ionicons name="book" size={24} color={subject.color} />
          </View>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.subjectStats}>
            {subject.lessonsCount} leçons • {subject.completedLessons} terminées
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Leçons</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateLesson' as never, { subjectId })}
          >
            <Ionicons name="add" size={20} color={Colors.accent.blue} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.blue} />
          </View>
        ) : lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Aucune leçon</Text>
            <Text style={styles.emptySubtitle}>Créez votre première leçon pour cette matière</Text>
            <TouchableOpacity 
              style={styles.createLessonButton}
              onPress={() => navigation.navigate('CreateLesson' as never, { subjectId })}
            >
              <Text style={styles.createLessonButtonText}>Créer une leçon</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={lessons}
            renderItem={renderLesson}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lessonsList}
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
  subjectIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectName: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subjectStats: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
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
  lessonsList: {
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
  createLessonButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createLessonButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
});
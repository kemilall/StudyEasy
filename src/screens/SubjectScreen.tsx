import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LessonCard } from '../components/LessonCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList, SubjectsStackParamList } from '../navigation/types';
import { Lesson, Subject } from '../types';
import { fetchLessonsBySubject, fetchSubject } from '../api/backend';
import { loadCachedLessons, loadCachedSubject } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

type SubjectScreenRouteProp = RouteProp<SubjectsStackParamList, 'Subject'>;

export const SubjectScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const route = useRoute<SubjectScreenRouteProp>();
  const { subjectId } = route.params;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [subjectData, lessonsData] = await Promise.all([
        fetchSubject(subjectId),
        fetchLessonsBySubject(subjectId),
      ]);
      setSubject(subjectData);
      setLessons(lessonsData);
    } catch (_err) {
      setError("Impossible de charger cette matière.");
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapFromCache = async () => {
      if (!user) return;
      const cachedSubject = await loadCachedSubject(subjectId);
      const cachedLessons = await loadCachedLessons(subjectId);
      if (isMounted) {
        if (cachedSubject) {
          setSubject(cachedSubject);
        }
        if (cachedLessons.length) {
          setLessons(cachedLessons);
        }
      }
    };

    bootstrapFromCache();
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, loadData]);

  const renderLesson = ({ item }: { item: Lesson }) => (
    <LessonCard
      lesson={item}
      onPress={() => navigation.navigate('Lesson', { lessonId: item.id })}
    />
  );

  const renderHeader = () => {
    if (!subject) {
      return null;
    }

    const progress = subject.lessonsCount > 0
      ? Math.round((subject.completedLessons / subject.lessonsCount) * 100)
      : 0;

    return (
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <View 
            style={[styles.colorIndicator, { backgroundColor: subject.color }]} 
          />
          <Text style={styles.title}>{subject.name}</Text>
        </View>
      </View>
    );
  };

  if (isLoading && !subject) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent.blue} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="warning" size={36} color={Colors.accent.red} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!subject) {
    return null;
  }

  const progress = subject.lessonsCount > 0
    ? Math.round((subject.completedLessons / subject.lessonsCount) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{subject.lessonsCount}</Text>
          <Text style={styles.statLabel}>Leçons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{subject.completedLessons}</Text>
          <Text style={styles.statLabel}>Complétées</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress}%</Text>
          <Text style={styles.statLabel}>Progression</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.addLessonButton}
        onPress={() => navigation.navigate('CreateLessonScreen', { subjectId })}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.accent.blue} />
        <Text style={styles.addLessonText}>Ajouter une leçon</Text>
      </TouchableOpacity>

      <FlatList
        data={lessons}
        renderItem={renderLesson}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name="documents-outline" size={28} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Pas encore de leçon</Text>
            <Text style={styles.emptySubtitle}>Créez votre première leçon pour cette matière.</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  addLessonText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    ...Typography.headline,
    color: Colors.text.secondary,
  },
  emptySubtitle: {
    ...Typography.subheadline,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.subheadline,
    color: Colors.accent.red,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.accent.blue,
    borderRadius: 24,
  },
  retryText: {
    ...Typography.footnote,
    color: Colors.surface,
  },
});

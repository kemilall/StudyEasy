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
import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { ChapterCard } from '../components/ChapterCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList, SubjectsStackParamList } from '../navigation/types';
import { Chapter, Lesson } from '../types';
import { fetchChaptersByLesson, fetchLesson } from '../api/backend';
import { loadCachedChapters, loadCachedLesson } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

type LessonScreenRouteProp = RouteProp<SubjectsStackParamList, 'Lesson'>;
type LessonScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<SubjectsStackParamList, 'Lesson'>,
  StackNavigationProp<RootStackParamList>
>;

export const LessonScreen: React.FC = () => {
  const navigation = useNavigation<LessonScreenNavigationProp>();
  const { user } = useAuth();
  const route = useRoute<LessonScreenRouteProp>();
  const { lessonId } = route.params;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [lessonData, chaptersData] = await Promise.all([
        fetchLesson(lessonId),
        fetchChaptersByLesson(lessonId),
      ]);
      setLesson(lessonData);
      setChapters(chaptersData);
    } catch (_err) {
      setError("Impossible de charger cette leçon.");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapFromCache = async () => {
      if (!user) return;
      const cachedLesson = await loadCachedLesson(lessonId);
      const cachedChapters = await loadCachedChapters(lessonId);
      if (isMounted) {
        if (cachedLesson) {
          setLesson(cachedLesson);
        }
        if (cachedChapters.length) {
          setChapters(cachedChapters);
        }
      }
    };

    bootstrapFromCache();
    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, loadData, lessonId]);

  if (isLoading && !lesson) {
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

  if (!lesson) {
    return null;
  }

  const renderChapter = ({ item }: { item: Chapter }) => (
    <ChapterCard
      chapter={item}
      onPress={() => navigation.navigate('Chapter', { chapterId: item.id })}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{lesson.name}</Text>
          <Text style={styles.subtitle}>
            {lesson.completedChapters}/{lesson.chaptersCount} chapitres complétés
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addChapterButton}
        onPress={() => navigation.navigate('CreateChapterScreen', { lessonId })}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.accent.blue} />
        <Text style={styles.addChapterText}>Créer un chapitre</Text>
      </TouchableOpacity>

      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={28} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Pas encore de chapitre</Text>
            <Text style={styles.emptySubtitle}>Ajoutez un chapitre pour commencer votre cours.</Text>
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
  },
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  addChapterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  addChapterText: {
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
    gap: 10,
  },
  emptyTitle: {
    ...Typography.headline,
    color: Colors.text.secondary,
  },
  emptySubtitle: {
    ...Typography.subheadline,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
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

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RecentChapterCard } from '../components/RecentChapterCard';
import { QuickQuizCard } from '../components/QuickQuizCard';
import { StreakCard } from '../components/StreakCard';
import { mockSubjects } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
type HomeScreenNavigationProp = StackNavigationProp<any, any>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Mock data pour les chapitres récents
  const recentChapters = [
    {
      id: '1',
      chapterName: 'Introduction aux Matrices',
      lessonName: 'Algèbre Linéaire',
      subjectName: 'Mathématiques',
      progress: 75,
    },
    {
      id: '2',
      chapterName: 'Les Forces',
      lessonName: 'Mécanique',
      subjectName: 'Physique',
      progress: 40,
    },
    {
      id: '3',
      chapterName: 'Structure Atomique',
      lessonName: 'Chimie Générale',
      subjectName: 'Chimie',
      progress: 90,
    },
  ];

  // Mock data pour les quiz récents
  const recentQuizzes = [
    {
      id: '1',
      subject: 'Mathématiques - Matrices',
      questionsCount: 10,
      difficulty: 'Moyen' as const,
      estimatedTime: 15,
    },
    {
      id: '2',
      subject: 'Physique - Forces',
      questionsCount: 8,
      difficulty: 'Facile' as const,
      estimatedTime: 10,
    },
  ];

  // Les 3 matières les plus utilisées
  const topSubjects = mockSubjects.slice(0, 3);

  const renderRecentChapter = ({ item }: { item: typeof recentChapters[0] }) => (
    <RecentChapterCard
      chapterName={item.chapterName}
      lessonName={item.lessonName}
      subjectName={item.subjectName}
      progress={item.progress}
      onPress={() => navigation.navigate('Chapter', { chapterId: item.id })}
    />
  );

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec salutation personnalisée */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getCurrentGreeting()}</Text>
            <Text style={styles.userName}>Alex</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationDot} />
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <StreakCard currentStreak={7} bestStreak={15} />

        {/* Bouton créer un chapitre */}
        <TouchableOpacity 
          style={styles.createChapterButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateChapterScreen' as never)}
        >
          <View style={styles.createChapterIcon}>
            <Ionicons name="add" size={24} color={Colors.accent.blue} />
          </View>
          <View style={styles.createChapterContent}>
            <Text style={styles.createChapterTitle}>Créer un nouveau chapitre</Text>
            <Text style={styles.createChapterSubtitle}>Importez un audio pour commencer</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>

        {/* Chapitres récents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continuer l'apprentissage</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentChapters}
            renderItem={renderRecentChapter}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Matières populaires */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vos matières</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Tout voir</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.subjectsGrid}>
            {topSubjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[styles.subjectCard, { backgroundColor: subject.color + '15' }]}
                activeOpacity={0.8}
              >
                <View style={[styles.subjectIcon, { backgroundColor: subject.color + '25' }]}>
                  <Ionicons name="book" size={20} color={subject.color} />
                </View>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectLessons}>
                  {subject.lessonsCount} leçons
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quiz rapides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quiz rapides</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {recentQuizzes.map((quiz) => (
            <QuickQuizCard
              key={quiz.id}
              subject={quiz.subject}
              questionsCount={quiz.questionsCount}
              difficulty={quiz.difficulty}
              estimatedTime={quiz.estimatedTime}
              onPress={() => navigation.navigate('Quiz', { chapterId: '1' })}
            />
          ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  userName: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.red,
    zIndex: 1,
  },
  createChapterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  createChapterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  createChapterContent: {
    flex: 1,
  },
  createChapterTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  createChapterSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 32,
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
  seeAll: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: 24,
  },
  subjectsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  subjectCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subjectLessons: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
});
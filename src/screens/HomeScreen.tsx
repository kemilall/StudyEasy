import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Subject, Lesson } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, userProfile } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState<boolean>(false);


  useEffect(() => {
    if (!user) return;

    setIsLoadingSubjects(true);
    setIsLoadingLessons(true);

    // Subscribe to real-time updates for user subjects
    const unsubscribeSubjects = DataService.subscribeToUserSubjects(user.uid, (updatedSubjects) => {
      setSubjects(updatedSubjects);
      setIsLoadingSubjects(false);
    });

    // Subscribe to real-time updates for recent lessons
    const unsubscribeLessons = DataService.subscribeToRecentLessons(user.uid, (updatedLessons) => {
      setRecentLessons(updatedLessons);
      setIsLoadingLessons(false);
    }, 10); // Limit to 10 recent lessons

    return () => {
      unsubscribeSubjects();
      unsubscribeLessons();
    };
  }, [user?.uid]);

  // Use real data only
  const displaySubjects = subjects;
  const displayLessons = recentLessons;

  const renderSubjectItem = ({ item }: { item: Subject }) => {
    // Choose different icons for different subjects - use saved icon or fallback to name-based logic
    const getSubjectIcon = (subject: Subject) => {
      if (subject.icon) {
        return subject.icon;
      }
      
      // Fallback to name-based logic for existing subjects without icons
      const lowercaseName = subject.name.toLowerCase();
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

    return (
      <TouchableOpacity
        style={[styles.subjectCard, item.isDeleting && styles.subjectCardDeleting]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Subjects', { screen: 'Subject', params: { subjectId: item.id } })}
        disabled={item.isDeleting}
      >
        {item.isDeleting && (
          <View style={styles.subjectLoadingOverlay}>
            <ActivityIndicator size="small" color={item.color} />
          </View>
        )}
        <View style={[styles.subjectCardContent, item.isDeleting && styles.fadedContent]}>
          <Ionicons 
            name={getSubjectIcon(item) as any} 
            size={24} 
            color={item.color} 
            style={styles.subjectMainIcon}
          />
          <Text style={styles.subjectName} numberOfLines={2}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentCourse = (item: Lesson, index: number) => {
    // Use the enriched data from the service
    const color = item.subjectColor || Colors.accent.blue;

    // Format date
    const formatDate = (date: Date) => {
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    };

    // Format duration
    const formatDuration = (minutes: number) => {
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.courseRowCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Lesson', { lessonId: item.id })}
      >
        <View style={styles.courseRowContent}>
          <View style={styles.courseRowHeader}>
            <View style={[styles.courseBadge, { backgroundColor: color + '15' }]}>
              <Text style={[styles.courseBadgeText, { color }]}>
                {item.subjectName || 'Matière'}
              </Text>
            </View>
            <View style={styles.courseRowMeta}>
              <View style={styles.courseMetaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                <Text style={styles.courseMetaText}>
                  {formatDuration(item.duration || 45)}
                </Text>
              </View>
              <View style={styles.courseMetaItem}>
                <Ionicons name="calendar-outline" size={14} color={Colors.text.tertiary} />
                <Text style={styles.courseMetaText}>
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.courseRowTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.courseRowFooter}>
            <Text style={styles.courseRowProgress}>
              {item.isCompleted ? '100' : '0'}% terminé
            </Text>
            <View style={styles.courseRowProgressBar}>
              <View
                style={[
                  styles.courseRowProgressFill,
                  {
                    width: `${item.isCompleted ? 100 : 0}%`,
                    backgroundColor: color
                  }
                ]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.userName}>{userProfile?.displayName || 'Étudiant'}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RecordingSubjectPicker' as never)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="mic" size={24} color={Colors.accent.red} />
            </View>
            <Text style={styles.actionButtonText}>Enregistrer</Text>
            <Text style={styles.actionButtonSubtext}>un cours</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Subjects', { screen: 'SubjectsList' })}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="volume-high" size={24} color={Colors.accent.blue} />
            </View>
            <Text style={styles.actionButtonText}>Importer</Text>
            <Text style={styles.actionButtonSubtext}>un audio</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CreateLesson')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="document-text" size={24} color={Colors.accent.green} />
            </View>
            <Text style={styles.actionButtonText}>Importer</Text>
            <Text style={styles.actionButtonSubtext}>un cours</Text>
          </TouchableOpacity>
        </View>

        {/* Subjects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Matières</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Subjects', { screen: 'SubjectsList' })}>
              <Text style={styles.seeAllButton}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {isLoadingSubjects ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.accent.blue} />
            </View>
          ) : displaySubjects.length === 0 ? (
            <TouchableOpacity 
              style={styles.emptySubjects}
              onPress={() => navigation.navigate('CreateSubject')}
            >
              <Ionicons name="add-circle-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>Créer une matière</Text>
            </TouchableOpacity>
          ) : (
            <FlatList
              data={displaySubjects}
              renderItem={renderSubjectItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectsList}
            />
          )}
        </View>

        {/* Recent Courses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cours récents</Text>
          </View>

          {isLoadingLessons ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.accent.blue} />
            </View>
          ) : displayLessons.length === 0 ? (
            <View style={styles.emptyCoursesContainer}>
              <View style={styles.emptyCourseCard}>
                <Ionicons name="book-outline" size={48} color={Colors.text.tertiary} />
                <Text style={styles.emptyCoursesText}>Aucun cours récent</Text>
                <Text style={styles.emptyCoursesSubtext}>
                  Commencez par enregistrer ou importer un cours
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.coursesColumn}>
              {displayLessons.slice(0, 10).map((lesson, index) =>
                renderRecentCourse(lesson, index)
              )}
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
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  welcomeText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  userName: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    marginTop: 4,
    fontWeight: '800',
  },
  profileButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 36,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    ...Typography.footnote,
    color: Colors.text.primary,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  actionButtonSubtext: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  seeAllButton: {
    ...Typography.footnote,
    color: Colors.accent.blue,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subjectsList: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  subjectCard: {
    width: 180,
    height: 70,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  subjectMainIcon: {
    flexShrink: 0,
  },
  subjectName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySubjects: {
    height: 100,
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
    marginTop: 8,
    fontWeight: '600',
  },
  coursesColumn: {
    paddingHorizontal: 20,
    gap: 12,
  },
  courseRowCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  courseRowContent: {
    padding: 16,
  },
  courseRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseBadgeText: {
    ...Typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseRowMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseMetaText: {
    ...Typography.caption2,
    color: Colors.text.tertiary,
  },
  courseRowTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 12,
  },
  courseRowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseRowProgress: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginRight: 12,
  },
  courseRowProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
  },
  courseRowProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyCoursesContainer: {
    paddingHorizontal: 20,
  },
  emptyCourseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyCoursesText: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginTop: 16,
    fontWeight: '700',
  },
  emptyCoursesSubtext: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  subjectCardDeleting: {
    opacity: 0.9,
  },
  subjectLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fadedContent: {
    opacity: 0.3,
  },
});
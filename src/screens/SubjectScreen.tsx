import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LessonCard } from '../components/LessonCard';
import { mockSubjects, mockLessons } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';

type SubjectScreenRouteProp = RouteProp<RootStackParamList, 'Subject'>;
type SubjectScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Subject'>;

export const SubjectScreen: React.FC = () => {
  const navigation = useNavigation<SubjectScreenNavigationProp>();
  const route = useRoute<SubjectScreenRouteProp>();
  const { subjectId } = route.params;

  const subject = mockSubjects.find(s => s.id === subjectId);
  const lessons = mockLessons.filter(l => l.subjectId === subjectId);

  if (!subject) {
    return null;
  }

  const renderLesson = ({ item }: { item: typeof lessons[0] }) => (
    <LessonCard
      lesson={item}
      onPress={() => navigation.navigate('Lesson', { lessonId: item.id })}
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
          <View 
            style={[styles.colorIndicator, { backgroundColor: subject.color }]} 
          />
          <Text style={styles.title}>{subject.name}</Text>
        </View>
      </View>

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
          <Text style={styles.statValue}>
            {subject.lessonsCount > 0 
              ? Math.round((subject.completedLessons / subject.lessonsCount) * 100)
              : 0}%
          </Text>
          <Text style={styles.statLabel}>Progression</Text>
        </View>
      </View>

      <FlatList
        data={lessons}
        renderItem={renderLesson}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginBottom: 24,
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
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
});

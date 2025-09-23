import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SubjectCard } from '../components/SubjectCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { SubjectsStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Subject } from '../types';

type SubjectsListNavigationProp = StackNavigationProp<SubjectsStackParamList, 'SubjectsList'>;

export const SubjectsListScreen: React.FC = () => {
  const navigation = useNavigation<SubjectsListNavigationProp>();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = DataService.subscribeToUserSubjects(user.uid, (userSubjects) => {
      setSubjects(userSubjects);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderSubject = ({ item }: { item: Subject }) => (
    <SubjectCard
      subject={item}
      onPress={() => navigation.navigate('Subject', { subjectId: item.id })}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matières</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.createSubjectButton} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateSubject' as never)}
      >
        <View style={styles.createSubjectIcon}>
          <Ionicons name="add" size={24} color={Colors.accent.blue} />
        </View>
        <View style={styles.createSubjectContent}>
          <Text style={styles.createSubjectTitle}>Créer une nouvelle matière</Text>
          <Text style={styles.createSubjectSubtitle}>Organisez vos cours par sujet</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={Colors.text.tertiary} />
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      ) : subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Aucune matière</Text>
          <Text style={styles.emptySubtitle}>Créez votre première matière pour commencer vos études</Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          renderItem={renderSubject}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    paddingBottom: 16,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  row: {
    gap: 16,
  },
  createSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 24,
    marginBottom: 24,
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
  createSubjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  createSubjectContent: {
    flex: 1,
  },
  createSubjectTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  createSubjectSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
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
  },
});
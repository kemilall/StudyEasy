import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SubjectCard } from '../components/SubjectCard';
import { mockSubjects } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { SubjectsStackParamList } from '../navigation/types';

type SubjectsListNavigationProp = StackNavigationProp<SubjectsStackParamList, 'SubjectsList'>;

export const SubjectsListScreen: React.FC = () => {
  const navigation = useNavigation<SubjectsListNavigationProp>();

  const renderSubject = ({ item }: { item: typeof mockSubjects[0] }) => (
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
        onPress={() => navigation.navigate('CreateSubjectScreen' as never)}
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

      <FlatList
        data={mockSubjects}
        renderItem={renderSubject}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
});

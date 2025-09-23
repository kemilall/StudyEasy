import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { SubjectsStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Subject } from '../types';
import { SubjectCard } from '../components/SubjectCard';

type SubjectsListNavigationProp = StackNavigationProp<SubjectsStackParamList, 'SubjectsList'>;

export const SubjectsListScreen: React.FC = () => {
  const navigation = useNavigation<SubjectsListNavigationProp>();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const { width } = Dimensions.get('window');
  const CARD_GAP = 12;
  const H_PADDING = 20;
  const CARD_WIDTH = Math.floor((width - H_PADDING * 2 - CARD_GAP) / 2);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = DataService.subscribeToUserSubjects(user.uid, (userSubjects) => {
      setSubjects(userSubjects);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await DataService.deleteSubject(subjectId);
    } catch (error) {
      console.error('Error deleting subject:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la matière. Veuillez réessayer.');
    }
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <View style={{ width: CARD_WIDTH }}>
      <SubjectCard
        subject={item}
        onPress={() => navigation.navigate('Subject', { subjectId: item.id })}
        onDelete={() => handleDeleteSubject(item.id)}
        editMode={editMode}
      />
    </View>
  );

  if (isLoading) {
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
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        renderItem={renderSubject}
        numColumns={2}
        columnWrapperStyle={{ gap: CARD_GAP, paddingHorizontal: H_PADDING, marginBottom: CARD_GAP }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Mes Matières</Text>
                  <Text style={styles.subtitle}>Gérez vos cours par matière</Text>
                </View>
                {subjects.length > 0 && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditMode(!editMode)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={editMode ? "checkmark" : "create-outline"} 
                      size={20} 
                      color={editMode ? Colors.accent.green : Colors.accent.blue} 
                    />
                    <Text style={[styles.editButtonText, { color: editMode ? Colors.accent.green : Colors.accent.blue }]}>
                      {editMode ? 'Terminer' : 'Modifier'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {/* Create Subject Button */}
            <TouchableOpacity 
              style={styles.createButton} 
              activeOpacity={0.7}
              onPress={() => (navigation as any).navigate('CreateSubject')}
            >
              <View style={styles.createIconContainer}>
                <Ionicons name="add-circle" size={24} color={Colors.accent.blue} />
              </View>
              <View style={styles.createTextContainer}>
                <Text style={styles.createTitle}>Nouvelle matière</Text>
                <Text style={styles.createSubtitle}>Organisez vos cours par sujet</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={64} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>Aucune matière</Text>
              <Text style={styles.emptySubtitle}>
                Créez votre première matière pour commencer à organiser vos cours
              </Text>
            </View>
          </View>
        }
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 6,
  },
  editButtonText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 20,
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
  createIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  createSubtitle: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  subjectsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  subjectTile: {
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectTileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  subjectTileName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  emptyCard: {
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
  emptyTitle: {
    ...Typography.title2,
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
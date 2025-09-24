import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { width } = Dimensions.get('window');
  const CARD_GAP = 12;
  const H_PADDING = 20;
  const CARD_WIDTH = (width - H_PADDING * 2 - CARD_GAP) / 2;

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
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => (navigation as any).navigate('CreateSubject')}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="add" 
                    size={24} 
                    color={Colors.accent.blue} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={64} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>Aucune matière</Text>
              <Text style={styles.emptySubtitle}>
                Appuyez sur le bouton + en haut pour créer votre première matière
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
    alignItems: 'center',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
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
  },
  editButtonIcon: {
    marginRight: 6,
  },
  editButtonText: {
    ...Typography.footnote,
    fontWeight: '600',
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
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SubjectCard } from '../components/SubjectCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Subject } from '../types';
import { fetchSubjects } from '../api/backend';
import { loadCachedSubjects } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const SubjectsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await fetchSubjects();
      setSubjects(data);
    } catch (_err) {
      setError("Impossible de charger les matières. Vérifiez votre connexion au backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      if (user) {
        const cached = await loadCachedSubjects();
        if (cached.length && isMounted) {
          setSubjects(cached);
        }
      }
      loadSubjects();
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [user, loadSubjects]);

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
        onPress={() => navigation.navigate('CreateSubjectScreen')}
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
        data={subjects}
        renderItem={renderSubject}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadSubjects} />}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={32} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Aucune matière pour l'instant</Text>
            <Text style={styles.emptySubtitle}>Créez votre première matière pour commencer.</Text>
          </View>
        ) : null}
      />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
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
    paddingBottom: 120,
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
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    ...Typography.headline,
    color: Colors.text.secondary,
  },
  emptySubtitle: {
    ...Typography.subheadline,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: Colors.accent.red + '10',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.accent.red,
    textAlign: 'center',
  },
});

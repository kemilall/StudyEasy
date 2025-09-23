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

type SubjectsListNavigationProp = StackNavigationProp<SubjectsStackParamList, 'SubjectsList'>;

export const SubjectsListScreen: React.FC = () => {
  const navigation = useNavigation<SubjectsListNavigationProp>();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const getSubjectIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
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

  const renderSubject = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[styles.subjectTile, { width: CARD_WIDTH }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Subject', { subjectId: item.id })}
    >
      <View style={styles.subjectTileContent}>
        <Ionicons 
          name={getSubjectIcon(item.name) as any} 
          size={22} 
          color={item.color} 
          style={{ marginRight: 10 }}
        />
        <Text style={styles.subjectTileName} numberOfLines={2}>{item.name}</Text>
      </View>
    </TouchableOpacity>
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
              <Text style={styles.title}>Mes Matières</Text>
              <Text style={styles.subtitle}>Gérez vos cours par matière</Text>
            </View>
            {/* Create Subject Button */}
            <TouchableOpacity 
              style={styles.createButton} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CreateSubject' as never)}
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
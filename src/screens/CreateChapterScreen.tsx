import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson } from '../types';

interface RouteParams {
  lessonId?: string;
}

export const CreateChapterScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId: routeLessonId } = (route.params as RouteParams) || {};
  
  const [chapterName, setChapterName] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadLessons = async () => {
      try {
        // We need to get all lessons for the user
        // This is a limitation - we should create a method to get all user lessons
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading lessons:', error);
        setIsLoading(false);
      }
    };

    loadLessons();
  }, [user]);

  const handleCreate = async () => {
    if (!chapterName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le chapitre.');
      return;
    }

    if (!selectedLesson) {
      Alert.alert('Erreur', 'Veuillez sélectionner une leçon.');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un chapitre.');
      return;
    }

    // Instead of creating here, navigate to AudioImport
    navigation.navigate('AudioImport' as never, {
      lessonId: selectedLesson.id,
      chapterName: chapterName.trim()
    });
  };

  const renderLessonItem = ({ item }: { item: Lesson }) => (
    <TouchableOpacity
      style={[
        styles.lessonItem,
        selectedLesson?.id === item.id && styles.lessonItemSelected,
      ]}
      onPress={() => setSelectedLesson(item)}
    >
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonName}>{item.name}</Text>
        <Text style={styles.lessonChapters}>{item.chaptersCount} chapitres</Text>
      </View>
      {selectedLesson?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={Colors.accent.blue} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau chapitre</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          style={[styles.saveButton, (!chapterName.trim() || !selectedLesson || isCreating) && styles.saveButtonDisabled]}
          disabled={!chapterName.trim() || !selectedLesson || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={[styles.saveButtonText, (!chapterName.trim() || !selectedLesson || isCreating) && styles.saveButtonTextDisabled]}>
              Continuer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom du chapitre *</Text>
            <TextInput
              style={styles.textInput}
              value={chapterName}
              onChangeText={setChapterName}
              placeholder="Ex: Introduction aux matrices"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
        </View>

        {/* Lesson Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leçon *</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.accent.blue} />
          ) : lessons.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyStateText}>Aucune leçon trouvée</Text>
              <Text style={styles.emptyStateSubtext}>Créez d'abord une leçon</Text>
              <TouchableOpacity 
                style={styles.createLessonButton}
                onPress={() => navigation.navigate('CreateLesson' as never)}
              >
                <Ionicons name="add" size={20} color={Colors.accent.blue} />
                <Text style={styles.createLessonButtonText}>Créer une leçon</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={lessons}
              renderItem={renderLessonItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.lessonsList}
            />
          )}
        </View>

        {/* Next Steps Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={24} color={Colors.accent.blue} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Prochaine étape</Text>
            <Text style={styles.infoText}>
              Après avoir créé ce chapitre, vous pourrez importer un fichier audio ou texte 
              qui sera automatiquement traité par l'IA pour générer le contenu d'apprentissage.
            </Text>
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.accent.blue,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  saveButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    ...Typography.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  lessonsList: {
    gap: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  lessonItemSelected: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '10',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  lessonChapters: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyStateText: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  createLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.blue + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  createLessonButtonText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.blue + '10',
    borderRadius: 16,
    padding: 20,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
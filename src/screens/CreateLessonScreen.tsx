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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { createLesson, fetchSubjects } from '../api/backend';
import { Subject } from '../types';
import { loadCachedSubjects } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

type CreateLessonScreenRouteProp = RouteProp<{ params: { subjectId?: string } }, 'params'>;

export const CreateLessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateLessonScreenRouteProp>();
  const subjectId = route.params?.subjectId;
  const { user } = useAuth();
  
  const [lessonName, setLessonName] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSubjects = async () => {
      try {
        setError(null);
        setIsLoading(true);
        if (user) {
          const cached = await loadCachedSubjects();
          if (isMounted && cached.length) {
            setSubjects(cached);
            const initialCached = subjectId ? cached.find((s) => s.id === subjectId) : cached[0] ?? null;
            setSelectedSubject(initialCached ?? null);
          }
        }

        const data = await fetchSubjects();
        if (!isMounted) return;
        setSubjects(data);
        const initial = subjectId ? data.find((s) => s.id === subjectId) : data[0] ?? null;
        setSelectedSubject(initial ?? null);
      } catch (_err) {
        if (isMounted) {
          setError('Impossible de charger les matières.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, [subjectId, user]);

  const handleCreate = async () => {
    if (!lessonName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la leçon.');
      return;
    }

    if (!selectedSubject) {
      Alert.alert('Erreur', 'Veuillez sélectionner une matière.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createLesson({
        subjectId: selectedSubject.id,
        name: lessonName.trim(),
        description: description.trim() || undefined,
      });
      Alert.alert(
        'Leçon créée !',
        `La leçon "${lessonName}" a été créée dans ${selectedSubject.name}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (_err) {
      Alert.alert('Erreur', "Impossible de créer la leçon. Vérifiez votre backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent.blue} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="warning" size={36} color={Colors.accent.red} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouvelle leçon</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          style={[styles.saveButton, (!lessonName.trim() || !selectedSubject || isSubmitting) && styles.saveButtonDisabled]}
          disabled={!lessonName.trim() || !selectedSubject || isSubmitting}
        >
          <Text style={[styles.saveButtonText, (!lessonName.trim() || !selectedSubject) && styles.saveButtonTextDisabled]}>
            {isSubmitting ? '...' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prévisualisation */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewName}>
                {lessonName || 'Nom de la leçon'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </View>
            
            <View style={styles.previewInfo}>
              <View style={styles.previewInfoItem}>
                <Ionicons name="book-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.previewInfoText}>0 chapitres</Text>
              </View>
              <View style={styles.previewInfoItem}>
                <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.previewInfoText}>0 min</Text>
              </View>
            </View>
            
            <View style={styles.previewProgress}>
              <View style={styles.previewProgressBar}>
                <View style={styles.previewProgressFill} />
              </View>
              <Text style={styles.previewProgressText}>0%</Text>
            </View>
          </View>
        </View>

        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de la leçon *</Text>
            <TextInput
              style={styles.textInput}
              value={lessonName}
              onChangeText={setLessonName}
              placeholder="Ex: Algèbre Linéaire"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez le contenu de cette leçon..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Sélection de matière */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matière</Text>
          <View style={styles.subjectsContainer}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectOption,
                  { backgroundColor: subject.color + '15' },
                  selectedSubject?.id === subject.id && styles.subjectOptionSelected,
                ]}
                onPress={() => setSelectedSubject(subject)}
              >
                <View style={[styles.subjectIcon, { backgroundColor: subject.color + '25' }]}>
                  <Ionicons name="book" size={20} color={subject.color} />
                </View>
                <Text style={styles.subjectName}>{subject.name}</Text>
                {selectedSubject?.id === subject.id && (
                  <Ionicons name="checkmark-circle" size={20} color={subject.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Après création</Text>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="add-circle-outline" size={24} color={Colors.accent.blue} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Créer le premier chapitre</Text>
              <Text style={styles.quickActionSubtitle}>Commencez directement par ajouter du contenu</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray[200],
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
    padding: 24,
  },
  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewName: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  previewInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  previewInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewInfoText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  previewProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  previewProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
    width: '30%',
  },
  previewProgressText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text.primary,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectOption: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.accent.blue,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  quickActionSubtitle: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  errorText: {
    ...Typography.subheadline,
    color: Colors.accent.red,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.accent.blue,
    borderRadius: 24,
  },
  retryText: {
    ...Typography.footnote,
    color: Colors.surface,
  },
});

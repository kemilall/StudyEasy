import React, { useCallback, useEffect, useState } from 'react';
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
import { createChapterFromText, fetchLesson, fetchLessonsBySubject, fetchSubjects } from '../api/backend';
import { Lesson, Subject } from '../types';

type CreateChapterScreenRouteProp = RouteProp<{ params: { lessonId?: string } }, 'params'>;

export const CreateChapterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<CreateChapterScreenRouteProp>();
  const lessonId = route.params?.lessonId;
  
  const [chapterName, setChapterName] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [hasAudio, setHasAudio] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLessonsForSubject = useCallback(async (subjectId: string) => {
    const data = await fetchLessonsBySubject(subjectId);
    setLessons(data);
    const defaultLesson = lessonId ? data.find((l) => l.id === lessonId) : data[0] ?? null;
    setSelectedLesson(defaultLesson ?? null);
  }, [lessonId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const subjectsData = await fetchSubjects();
        setSubjects(subjectsData);

        if (lessonId) {
          const lessonData = await fetchLesson(lessonId);
          const subject = subjectsData.find((s) => s.id === lessonData.subjectId) ?? null;
          setSelectedSubject(subject);
          await loadLessonsForSubject(lessonData.subjectId);
          setSelectedLesson(lessonData);
        } else {
          const defaultSubject = subjectsData[0] ?? null;
          setSelectedSubject(defaultSubject ?? null);
          if (defaultSubject) {
            await loadLessonsForSubject(defaultSubject.id);
          }
        }
      } catch (_err) {
        setError('Impossible de charger les données nécessaires.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [lessonId, loadLessonsForSubject]);

  const handleSubjectChange = async (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedLesson(null);
    setLessons([]);
    try {
      await loadLessonsForSubject(subject.id);
    } catch (_err) {
      Alert.alert('Erreur', 'Impossible de charger les leçons pour cette matière.');
    }
  };

  const handleCreate = async () => {
    if (!chapterName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le chapitre.');
      return;
    }

    if (!selectedLesson) {
      Alert.alert('Erreur', 'Veuillez sélectionner une leçon.');
      return;
    }

    if (hasAudio) {
      navigation.navigate('AudioImportScreen', {
        lessonId: selectedLesson.id,
        name: chapterName.trim(),
        description: description.trim() || undefined,
      });
      return;
    }

    if (!textContent.trim()) {
      Alert.alert('Erreur', 'Veuillez coller le contenu texte du cours.');
      return;
    }

    try {
      setIsSubmitting(true);
      const chapter = await createChapterFromText({
        lessonId: selectedLesson.id,
        name: chapterName.trim(),
        description: description.trim() || undefined,
        textInput: textContent.trim(),
      });
      navigation.navigate('ProcessingScreen', { chapterId: chapter.id });
    } catch (_err) {
      Alert.alert('Erreur', 'Impossible de créer le chapitre. Vérifiez votre backend.');
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
        <Text style={styles.title}>Nouveau chapitre</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          style={[styles.saveButton, (!chapterName.trim() || !selectedLesson || isSubmitting) && styles.saveButtonDisabled]}
          disabled={!chapterName.trim() || !selectedLesson || isSubmitting}
        >
          <Text style={[styles.saveButtonText, (!chapterName.trim() || !selectedLesson) && styles.saveButtonTextDisabled]}>
            {hasAudio ? 'Continuer' : isSubmitting ? '...': 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewName}>
              {chapterName || 'Nom du chapitre'}
            </Text>
            {hasAudio ? (
              <View style={styles.previewContent}>
                <Text style={styles.previewSummary}>
                  Ce chapitre sera généré automatiquement à partir de votre fichier audio.
                </Text>
                <View style={styles.previewFeatures}>
                  <View style={styles.previewFeature}>
                    <Ionicons name="document-text-outline" size={16} color={Colors.accent.blue} />
                    <Text style={styles.previewFeatureText}>Transcription</Text>
                  </View>
                  <View style={styles.previewFeature}>
                    <Ionicons name="albums-outline" size={16} color={Colors.accent.green} />
                    <Text style={styles.previewFeatureText}>Flashcards</Text>
                  </View>
                  <View style={styles.previewFeature}>
                    <Ionicons name="help-circle-outline" size={16} color={Colors.accent.orange} />
                    <Text style={styles.previewFeatureText}>Quiz</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.previewContent}>
                <Text style={styles.previewSummary}>
                  Le contenu sera généré à partir du texte que vous fournissez ci-dessous.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom du chapitre *</Text>
            <TextInput
              style={styles.textInput}
              value={chapterName}
              onChangeText={setChapterName}
              placeholder="Ex: Introduction aux Matrices"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez le contenu de ce chapitre..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matière et leçon</Text>
          <View style={styles.subjectsContainer}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectOption,
                  { backgroundColor: subject.color + '15' },
                  selectedSubject?.id === subject.id && styles.subjectOptionSelected,
                ]}
                onPress={() => handleSubjectChange(subject)}
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

          <View style={styles.lessonsContainer}>
            {lessons.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonOption,
                  selectedLesson?.id === lesson.id && styles.lessonOptionSelected,
                ]}
                onPress={() => setSelectedLesson(lesson)}
              >
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonName}>{lesson.name}</Text>
                  <Text style={styles.lessonSubtitle}>
                    {lesson.completedChapters}/{lesson.chaptersCount} chapitres
                  </Text>
                </View>
                {selectedLesson?.id === lesson.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent.blue} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contenu</Text>
          <View style={styles.contentOptions}>
            <TouchableOpacity
              style={[
                styles.contentOption,
                !hasAudio && styles.contentOptionSelected,
              ]}
              onPress={() => setHasAudio(false)}
            >
              <View style={styles.contentOptionIcon}>
                <Ionicons name="document-outline" size={24} color={!hasAudio ? Colors.accent.blue : Colors.text.secondary} />
              </View>
              <View style={styles.contentOptionContent}>
                <Text style={[styles.contentOptionTitle, !hasAudio && styles.contentOptionTitleSelected]}>
                  Coller un texte
                </Text>
                <Text style={styles.contentOptionSubtitle}>
                  Générer le chapitre à partir d'un texte existant
                </Text>
              </View>
              {!hasAudio && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.blue} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.contentOption,
                hasAudio && styles.contentOptionSelected,
              ]}
              onPress={() => setHasAudio(true)}
            >
              <View style={styles.contentOptionIcon}>
                <Ionicons name="mic-outline" size={24} color={hasAudio ? Colors.accent.blue : Colors.text.secondary} />
              </View>
              <View style={styles.contentOptionContent}>
                <Text style={[styles.contentOptionTitle, hasAudio && styles.contentOptionTitleSelected]}>
                  Importer un audio
                </Text>
                <Text style={styles.contentOptionSubtitle}>
                  Utiliser un fichier audio pour générer le cours
                </Text>
              </View>
              {hasAudio && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.blue} />
              )}
            </TouchableOpacity>
          </View>

          {!hasAudio && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contenu du cours *</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaLarge]}
                value={textContent}
                onChangeText={setTextContent}
                placeholder="Collez ici le texte du cours ou de la transcription..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={10}
              />
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
  section: {
    marginBottom: 24,
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
  previewName: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  previewContent: {
    gap: 12,
  },
  previewSummary: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  previewFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  previewFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewFeatureText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
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
    height: 100,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
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
  lessonsContainer: {
    gap: 12,
  },
  lessonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.accent.blue,
  },
  lessonInfo: {
    flex: 1,
    marginRight: 12,
  },
  lessonName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  lessonSubtitle: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  contentOptions: {
    gap: 12,
    marginBottom: 12,
  },
  contentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
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
  contentOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.accent.blue,
  },
  contentOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentOptionContent: {
    flex: 1,
    gap: 4,
  },
  contentOptionTitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  contentOptionTitleSelected: {
    color: Colors.text.primary,
  },
  contentOptionSubtitle: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
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

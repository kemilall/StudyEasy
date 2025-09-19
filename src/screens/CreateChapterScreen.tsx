import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { mockLessons, mockSubjects } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

type CreateChapterScreenRouteProp = RouteProp<{ params: { lessonId?: string } }, 'params'>;

export const CreateChapterScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateChapterScreenRouteProp>();
  const lessonId = route.params?.lessonId;
  
  const [chapterName, setChapterName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(
    lessonId ? mockLessons.find(l => l.id === lessonId) : mockLessons[0]
  );
  const [hasAudio, setHasAudio] = useState(false);

  const getSubjectForLesson = (lesson: any) => {
    return mockSubjects.find(s => s.id === lesson?.subjectId);
  };

  const handleCreate = () => {
    if (!chapterName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le chapitre.');
      return;
    }

    if (!selectedLesson) {
      Alert.alert('Erreur', 'Veuillez sélectionner une leçon.');
      return;
    }

    if (hasAudio) {
      navigation.navigate('AudioImportScreen' as never);
    } else {
      Alert.alert(
        'Chapitre créé !',
        `Le chapitre "${chapterName}" a été créé. Vous pouvez maintenant ajouter du contenu.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

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
          style={[styles.saveButton, !chapterName.trim() && styles.saveButtonDisabled]}
          disabled={!chapterName.trim()}
        >
          <Text style={[styles.saveButtonText, !chapterName.trim() && styles.saveButtonTextDisabled]}>
            {hasAudio ? 'Continuer' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prévisualisation */}
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
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={32} color={Colors.text.tertiary} />
                <Text style={styles.emptyStateText}>Chapitre vide - Ajoutez du contenu plus tard</Text>
              </View>
            )}
          </View>
        </View>

        {/* Informations de base */}
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

        {/* Sélection de leçon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leçon</Text>
          <View style={styles.lessonsContainer}>
            {mockLessons.map((lesson) => {
              const subject = getSubjectForLesson(lesson);
              return (
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
                    <Text style={styles.lessonSubject}>{subject?.name}</Text>
                  </View>
                  {selectedLesson?.id === lesson.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.accent.blue} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Options de contenu */}
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
                  Chapitre vide
                </Text>
                <Text style={styles.contentOptionSubtitle}>
                  Créer un chapitre sans contenu pour l'instant
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
                <Ionicons name="musical-notes" size={24} color={hasAudio ? Colors.accent.green : Colors.text.secondary} />
              </View>
              <View style={styles.contentOptionContent}>
                <Text style={[styles.contentOptionTitle, hasAudio && styles.contentOptionTitleSelected]}>
                  Importer un audio
                </Text>
                <Text style={styles.contentOptionSubtitle}>
                  Génération automatique du contenu à partir d'un fichier audio
                </Text>
              </View>
              {hasAudio && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
              )}
            </TouchableOpacity>
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
  previewSection: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  previewContent: {
    gap: 16,
  },
  previewSummary: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    lineHeight: 20,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    ...Typography.subheadline,
    color: Colors.text.tertiary,
    marginTop: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  lessonsContainer: {
    gap: 12,
  },
  lessonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lessonOptionSelected: {
    borderColor: Colors.accent.blue,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  lessonSubject: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  contentOptions: {
    gap: 12,
  },
  contentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contentOptionSelected: {
    borderColor: Colors.accent.blue,
  },
  contentOptionIcon: {
    marginRight: 16,
  },
  contentOptionContent: {
    flex: 1,
  },
  contentOptionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  contentOptionTitleSelected: {
    color: Colors.accent.blue,
  },
  contentOptionSubtitle: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});

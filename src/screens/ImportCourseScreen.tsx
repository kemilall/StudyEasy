import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { FileProcessingService } from '../services/fileProcessingService';
import { Subject } from '../types';

export const ImportCourseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const routeSubjectId = (route.params as { subjectId?: string } | undefined)?.subjectId;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = DataService.subscribeToUserSubjects(user.uid, (userSubjects) => {
      setSubjects(userSubjects);
      setIsLoadingSubjects(false);
      if (routeSubjectId && !selectedSubject) {
        const found = userSubjects.find(s => s.id === routeSubjectId) || null;
        setSelectedSubject(found);
      }
    });

    return () => unsubscribe();
  }, [user, routeSubjectId]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/rtf'
        ],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedFile(result);
        // Auto-fill lesson name from file name if not set
        if (!lessonName && result.name) {
          const nameWithoutExt = result.name.replace(/\.[^/.]+$/, "");
          setLessonName(nameWithoutExt);
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const processImport = async () => {
    if (!lessonName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la leçon.');
      return;
    }

    const subjectIdToUse = selectedSubject?.id || routeSubjectId;
    if (!subjectIdToUse) {
      Alert.alert('Erreur', 'Matière introuvable.');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour importer un cours.');
      return;
    }

    if (!pastedText.trim() && !selectedFile) {
      Alert.alert('Erreur', 'Veuillez ajouter du texte ou sélectionner un fichier.');
      return;
    }

    setIsProcessing(true);

    try {
      let contentToProcess = pastedText;

      if (selectedFile) {
        // Handle file processing
        if (selectedFile.type === 'success') {
          try {
            // Process the file using our service
            const processedFile = await FileProcessingService.processFile(
              selectedFile.uri,
              selectedFile.name
            );

            // Combine pasted text with file content
            if (processedFile.text.trim()) {
              contentToProcess = `${contentToProcess}\n\n${processedFile.text}`.trim();
            }
          } catch (fileError) {
            console.error('Erreur lors du traitement du fichier:', fileError);
            // Continue with pasted text only
            Alert.alert(
              'Information',
              'Le fichier n\'a pas pu être traité automatiquement. Utilisez uniquement le texte collé.'
            );
          }
        }
      }

      // Create lesson first
      const lessonData = {
        name: lessonName.trim(),
        content: contentToProcess,
        subjectId: subjectIdToUse,
        status: 'processing' as const,
        progress: 0,
      };

      const lessonId = await DataService.createLesson(user.uid, lessonData);

      // Navigate to processing screen with the lesson ID and content
      navigation.navigate('ProcessingScreen' as never, {
        lessonId: lessonId,
        subjectId: subjectIdToUse,
        subjectName: selectedSubject?.name || 'Matière',
        lessonName: lessonName.trim(),
        content: contentToProcess,
        source: selectedFile ? 'file' : 'text',
        documentText: contentToProcess,
        fileName: selectedFile?.name,
        mimeType: selectedFile?.type === 'success' ? 'application/octet-stream' : undefined,
      } as never);

    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du traitement du contenu');
      setIsProcessing(false);
    }
  };

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[
        styles.subjectItem,
        selectedSubject?.id === item.id && styles.subjectItemSelected,
        { borderColor: item.color }
      ]}
      onPress={() => setSelectedSubject(item)}
    >
      <View style={[styles.subjectIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name="book" size={20} color={item.color} />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectLessons}>{item.lessonsCount} leçons</Text>
      </View>
      {selectedSubject?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={item.color} />
      )}
    </TouchableOpacity>
  );

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return 'document-outline';

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'document-text-outline';
      case 'txt':
        return 'text-outline';
      case 'doc':
      case 'docx':
        return 'document-outline';
      default:
        return 'document-outline';
    }
  };

  const getFileTypeLabel = (fileName?: string) => {
    if (!fileName) return '';

    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'PDF';
      case 'txt':
        return 'Fichier texte';
      case 'doc':
        return 'Document Word';
      case 'docx':
        return 'Document Word';
      default:
        return 'Document';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Importer un cours</Text>
        <TouchableOpacity
          onPress={processImport}
          style={[
            styles.importButton,
            ((!lessonName.trim() || (!pastedText.trim() && !selectedFile)) || !selectedSubject) && styles.importButtonDisabled,
            isProcessing && styles.importButtonProcessing
          ]}
          disabled={(!lessonName.trim() || (!pastedText.trim() && !selectedFile)) || !selectedSubject || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={[
              styles.importButtonText,
              ((!lessonName.trim() || (!pastedText.trim() && !selectedFile)) || !selectedSubject || isProcessing) && styles.importButtonTextDisabled
            ]}>
              Importer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélection de matière */}
        {!routeSubjectId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matière *</Text>
            {isLoadingSubjects ? (
              <ActivityIndicator size="small" color={Colors.accent.blue} />
            ) : subjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="library-outline" size={48} color={Colors.text.tertiary} />
                <Text style={styles.emptyStateText}>Aucune matière trouvée</Text>
                <Text style={styles.emptyStateSubtext}>Créez d'abord une matière</Text>
                <TouchableOpacity
                  style={styles.createSubjectButton}
                  onPress={() => navigation.navigate('CreateSubject' as never)}
                >
                  <Ionicons name="add" size={20} color={Colors.accent.blue} />
                  <Text style={styles.createSubjectButtonText}>Créer une matière</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.subjectsList}>
                {subjects.map((item) => (
                  <View key={item.id}>
                    {renderSubjectItem({ item })}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Informations de la leçon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de la leçon</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de la leçon *</Text>
            <TextInput
              style={styles.textInput}
              value={lessonName}
              onChangeText={setLessonName}
              placeholder="Ex: Mathématiques chapitre 1"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
        </View>

        {/* Zone de collage de texte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contenu du cours</Text>
          <Text style={styles.sectionSubtitle}>
            Collez votre texte ou sélectionnez un fichier
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Texte du cours</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={pastedText}
              onChangeText={setPastedText}
              placeholder="Collez ici le contenu de votre cours..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.orText}>OU</Text>

          {/* Sélection de fichier */}
          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={pickDocument}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={Colors.accent.blue} />
            <Text style={styles.filePickerText}>
              {selectedFile ? 'Changer de fichier' : 'Sélectionner un fichier'}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.selectedFileContainer}>
              <View style={styles.selectedFileHeader}>
                <Ionicons name={getFileIcon(selectedFile.name)} size={20} color={Colors.accent.blue} />
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <TouchableOpacity onPress={removeFile} style={styles.removeFileButton}>
                  <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
                </TouchableOpacity>
              </View>
              <Text style={styles.fileTypeLabel}>
                {getFileTypeLabel(selectedFile.name)}
              </Text>
            </View>
          )}

          <View style={styles.fileTypesInfo}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.fileTypesText}>
              Formats acceptés : PDF, TXT, DOC, DOCX
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
  importButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.accent.blue,
    borderRadius: 12,
  },
  importButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  importButtonProcessing: {
    backgroundColor: Colors.accent.blue,
  },
  importButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
  importButtonTextDisabled: {
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
  sectionSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  subjectsList: {
    gap: 12,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  subjectItemSelected: {
    borderWidth: 2,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  subjectLessons: {
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
  createSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.blue + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  createSubjectButtonText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
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
    height: 150,
    textAlignVertical: 'top',
  },
  orText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginVertical: 16,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.blue + '10',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent.blue + '30',
    borderStyle: 'dashed',
    gap: 8,
  },
  filePickerText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  selectedFileContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.accent.blue + '30',
  },
  selectedFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedFileName: {
    flex: 1,
    ...Typography.subheadline,
    color: Colors.text.primary,
    marginLeft: 8,
  },
  removeFileButton: {
    padding: 4,
  },
  fileTypeLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  fileTypesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  fileTypesText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
});

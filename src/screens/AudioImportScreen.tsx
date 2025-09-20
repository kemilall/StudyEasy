import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { createChapterFromAudioUrl } from '../api/backend';
import { uploadAudioFile } from '../firebase/storage';

type AudioImportRouteProp = RouteProp<
  { params: { lessonId: string; name: string; description?: string } },
  'params'
>;

export const AudioImportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<AudioImportRouteProp>();
  const { lessonId, name, description } = route.params ?? {};
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!lessonId) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="warning" size={36} color={Colors.accent.red} />
        <Text style={styles.errorText}>Aucune leçon n'a été sélectionnée pour ce chapitre.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible de sélectionner le fichier audio.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !lessonId) return;
    
    setIsUploading(true);
    try {
      const remoteUrl = await uploadAudioFile(
        selectedFile.uri,
        selectedFile.name ?? 'audio.mp3'
      );

      const chapter = await createChapterFromAudioUrl({
        lessonId,
        name,
        description,
        audioUrl: remoteUrl,
      });
      navigation.navigate('ProcessingScreen', { chapterId: chapter.id });
    } catch (_err) {
      Alert.alert('Erreur', "Impossible d'envoyer le fichier audio. Vérifiez votre backend.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <Text style={styles.title}>Importer un audio</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{name}</Text>
          <Text style={styles.summarySubtitle}>{description || 'Le chapitre sera généré à partir de cet audio.'}</Text>
        </View>

        <View style={styles.instructionCard}>
          <View style={styles.instructionIcon}>
            <Ionicons name="information-circle" size={24} color={Colors.accent.blue} />
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Conseils pour un meilleur résultat</Text>
            <Text style={styles.instructionText}>
              {`• Utilisez un audio de bonne qualité\n• Évitez les bruits de fond\n• Durée recommandée : 5-60 minutes\n• Formats supportés : MP3, M4A, WAV`}
            </Text>
          </View>
        </View>

        {!selectedFile ? (
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickAudio}>
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.accent.blue} />
            </View>
            <Text style={styles.uploadTitle}>Sélectionner un fichier audio</Text>
            <Text style={styles.uploadSubtitle}>
              Touchez pour parcourir vos fichiers
            </Text>
            <View style={styles.supportedFormats}>
              <Text style={styles.formatsText}>MP3, M4A, WAV</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.filePreview}>
            <View style={styles.fileHeader}>
              <View style={styles.fileIcon}>
                <Ionicons name="musical-notes" size={24} color={Colors.accent.green} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name ?? 'audio'}</Text>
                <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setSelectedFile(null)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={24} color={Colors.accent.red} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.audioOptions}>
              <Text style={styles.optionsTitle}>Options de traitement incluses</Text>
              <View style={styles.option}>
                <Ionicons name="document-text-outline" size={20} color={Colors.text.secondary} />
                <Text style={styles.optionText}>Transcription automatique</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
              </View>
              <View style={styles.option}>
                <Ionicons name="bulb-outline" size={20} color={Colors.text.secondary} />
                <Text style={styles.optionText}>Génération de résumé</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
              </View>
              <View style={styles.option}>
                <Ionicons name="help-circle-outline" size={20} color={Colors.text.secondary} />
                <Text style={styles.optionText}>Création de quiz</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
              </View>
              <View style={styles.option}>
                <Ionicons name="albums-outline" size={20} color={Colors.text.secondary} />
                <Text style={styles.optionText}>Flashcards automatiques</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
              </View>
            </View>
          </View>
        )}

        {selectedFile && (
          <TouchableOpacity 
            style={[styles.uploadButton, (isUploading || !lessonId) && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading || !lessonId}
          >
            {isUploading ? (
              <>
                <ActivityIndicator size="small" color={Colors.surface} />
                <Text style={styles.uploadButtonText}>Traitement en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="arrow-up-circle" size={20} color={Colors.surface} />
                <Text style={styles.uploadButtonText}>Commencer le traitement</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 24,
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  summarySubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.blue + '10',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContent: {
    flex: 1,
    gap: 8,
  },
  instructionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  instructionText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 16,
    borderStyle: 'dashed',
    gap: 12,
  },
  uploadIcon: {
    padding: 12,
    borderRadius: 40,
    backgroundColor: Colors.accent.blue + '10',
  },
  uploadTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  uploadSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  supportedFormats: {
    marginTop: 12,
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  formatsText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  filePreview: {
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
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.green + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  fileSize: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  removeButton: {
    padding: 4,
  },
  audioOptions: {
    gap: 12,
  },
  optionsTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[100],
    padding: 14,
    borderRadius: 12,
  },
  optionText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    flex: 1,
    marginHorizontal: 12,
  },
  uploadButton: {
    marginTop: 12,
    backgroundColor: Colors.accent.blue,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: Colors.gray[200],
  },
  uploadButtonText: {
    ...Typography.headline,
    color: Colors.surface,
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

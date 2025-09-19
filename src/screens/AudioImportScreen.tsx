import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export const AudioImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setSelectedFile(result);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier audio.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    // Simuler l'upload
    setTimeout(() => {
      setIsUploading(false);
      navigation.navigate('ProcessingScreen' as never);
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
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
        <View style={styles.instructionCard}>
          <View style={styles.instructionIcon}>
            <Ionicons name="information-circle" size={24} color={Colors.accent.blue} />
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Conseils pour un meilleur résultat</Text>
            <Text style={styles.instructionText}>
              • Utilisez un audio de bonne qualité{'\n'}
              • Évitez les bruits de fond{'\n'}
              • Durée recommandée : 5-60 minutes{'\n'}
              • Formats supportés : MP3, M4A, WAV
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
                <Text style={styles.fileName}>{selectedFile.name}</Text>
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
              <Text style={styles.optionsTitle}>Options de traitement</Text>
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
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Ionicons name="hourglass-outline" size={20} color={Colors.surface} />
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
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.blue + '10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  instructionIcon: {
    marginRight: 16,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  instructionText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  uploadArea: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
  },
  uploadIcon: {
    marginBottom: 20,
  },
  uploadTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  uploadSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  supportedFormats: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  formatsText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  filePreview: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.green + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  fileSize: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  removeButton: {
    padding: 4,
  },
  audioOptions: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: 20,
  },
  optionsTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  optionText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    flex: 1,
  },
  uploadButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  uploadButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
});


import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chapter } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface ChapterCardProps {
  chapter: Chapter;
  onPress: () => void;
  onUpload?: () => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, onPress, onUpload }) => {
  const isProcessing = chapter.isProcessing || chapter.status === 'processing' || chapter.status === 'pending';
  const isFailed = chapter.status === 'failed';

  const renderContent = () => {
    if (isProcessing) {
      return (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color={Colors.accent.blue} />
          <Text style={styles.processingText}>Traitement en cours...</Text>
        </View>
      );
    }

    if (isFailed) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color={Colors.accent.red} />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Génération échouée</Text>
            <Text style={styles.errorMessage} numberOfLines={2}>
              {chapter.failureReason || 'Une erreur est survenue durant le traitement.'}
            </Text>
          </View>
        </View>
      );
    }

    if (!chapter.summary) {
      if (!onUpload) {
        return (
          <View style={styles.emptyPlaceholder}>
            <Ionicons name="document-outline" size={22} color={Colors.text.tertiary} />
            <Text style={styles.emptyPlaceholderText}>Contenu à générer prochainement</Text>
          </View>
        );
      }
      return (
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={onUpload}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={24} color={Colors.accent.blue} />
          <Text style={styles.uploadText}>Importer un audio</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.contentContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.statusIcon}>
            {chapter.isCompleted ? (
              <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
            ) : (
              <View style={styles.emptyCircle} />
            )}
          </View>
          <Text style={styles.duration}>{chapter.duration} min</Text>
        </View>
        
        <Text style={styles.summary} numberOfLines={3}>
          {chapter.summary}
        </Text>
        
        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <Ionicons name="document-text-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.actionText}>Transcription</Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="albums-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.actionText}>Flashcards</Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="help-circle-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.actionText}>Quiz</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{chapter.name}</Text>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
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
  name: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  processingText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.accent.red + '10',
    borderRadius: 12,
    padding: 16,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    ...Typography.subheadline,
    color: Colors.accent.red,
    marginBottom: 4,
    fontWeight: '600',
  },
  errorMessage: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  uploadButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  uploadText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
  },
  emptyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    borderStyle: 'dashed',
    paddingVertical: 28,
    gap: 8,
  },
  emptyPlaceholderText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  contentContainer: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIcon: {
    width: 20,
    height: 20,
  },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[300],
  },
  duration: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  summary: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
});

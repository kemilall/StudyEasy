import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RecordingDraft } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';

export const DraftsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<RecordingDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = DataService.subscribeToRecordingDrafts(user.uid, (updatedDrafts) => {
      setDrafts(updatedDrafts);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleResumeDraft = (draft: RecordingDraft) => {
    navigation.navigate('RecordingStudio' as never, {
      subjectId: draft.subjectId,
      subjectName: draft.subjectName,
      subjectColor: draft.subjectColor,
      lessonId: draft.id,
      draftId: draft.id,
      initialLessonName: draft.lessonName,
    } as never);
  };

  const handleDeleteDraft = (draft: RecordingDraft) => {
    Alert.alert(
      'Supprimer le brouillon',
      `Êtes-vous sûr de vouloir supprimer le brouillon "${draft.lessonName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await DataService.deleteRecordingDraft(user.uid, draft.id);
              }
            } catch (error) {
              console.error('Error deleting draft:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le brouillon');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderDraft = ({ item }: { item: RecordingDraft }) => (
    <TouchableOpacity
      style={styles.draftCard}
      onPress={() => handleResumeDraft(item)}
    >
      <View style={styles.draftHeader}>
        <View style={styles.draftInfo}>
          <View style={[styles.subjectBadge, { backgroundColor: (item.subjectColor || Colors.accent.blue) + '20' }]}>
            <Text style={[styles.subjectBadgeText, { color: item.subjectColor || Colors.accent.blue }]}>
              {item.subjectName}
            </Text>
          </View>
          <Text style={styles.draftTitle} numberOfLines={1}>{item.lessonName}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDraft(item)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.draftDetails}>
        <View style={styles.draftMeta}>
          <Ionicons name="time-outline" size={16} color={Colors.text.tertiary} />
          <Text style={styles.draftMetaText}>
            {formatDuration(item.durationMillis)}
          </Text>
        </View>
        <View style={styles.draftMeta}>
          <Ionicons name="calendar-outline" size={16} color={Colors.text.tertiary} />
          <Text style={styles.draftMetaText}>
            {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>

      <View style={styles.draftActions}>
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() => handleResumeDraft(item)}
        >
          <Ionicons name="play-circle" size={20} color={Colors.surface} />
          <Text style={styles.resumeButtonText}>Reprendre</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Brouillons</Text>
        <View style={styles.placeholder} />
      </View>

      {drafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Aucun brouillon</Text>
          <Text style={styles.emptySubtitle}>
            Vos enregistrements en cours apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          renderItem={renderDraft}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '800',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  draftCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  draftInfo: {
    flex: 1,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subjectBadgeText: {
    ...Typography.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  draftTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
    lineHeight: 24,
  },
  deleteButton: {
    padding: 4,
  },
  draftDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  draftMetaText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  draftActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 16,
  },
  resumeButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resumeButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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

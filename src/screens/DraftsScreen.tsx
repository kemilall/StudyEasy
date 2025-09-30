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
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const unsubscribe = DataService.subscribeToRecordingDrafts(user.uid, (updatedDrafts) => {
      setDrafts(updatedDrafts);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleResumeDraft = (draft: RecordingDraft) => {
    (navigation as any).navigate('RecordingStudio', {
      subjectId: draft.subjectId,
      subjectName: draft.subjectName,
      subjectColor: draft.subjectColor,
      lessonId: draft.id,
      draftId: draft.id,
      initialLessonName: draft.lessonName,
    });
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

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedDrafts(new Set());
  };

  const toggleDraftSelection = (draftId: string) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId);
    } else {
      newSelected.add(draftId);
    }
    setSelectedDrafts(newSelected);
  };

  const selectAllDrafts = () => {
    if (selectedDrafts.size === drafts.length) {
      setSelectedDrafts(new Set());
    } else {
      setSelectedDrafts(new Set(drafts.map(d => d.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDrafts.size === 0) return;

    Alert.alert(
      'Supprimer les brouillons',
      `Êtes-vous sûr de vouloir supprimer ${selectedDrafts.size} brouillon(s) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await Promise.all(
                  Array.from(selectedDrafts).map(draftId =>
                    DataService.deleteRecordingDraft(user.uid, draftId)
                  )
                );
                setSelectedDrafts(new Set());
                setIsSelectMode(false);
              }
            } catch (error) {
              console.error('Error deleting drafts:', error);
              Alert.alert('Erreur', 'Impossible de supprimer les brouillons');
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

  const renderDraft = ({ item }: { item: RecordingDraft }) => {
    const isSelected = selectedDrafts.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.draftCard, isSelected && styles.draftCardSelected]}
        onPress={() => isSelectMode ? toggleDraftSelection(item.id) : handleResumeDraft(item)}
      >
        <View style={[styles.draftContent, isSelectMode && styles.draftContentWithCheckbox]}>
          {isSelectMode && (
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkboxInner, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={Colors.surface} />}
              </View>
            </View>
          )}

          <View style={styles.draftMain}>
            <View style={styles.draftHeader}>
              <View style={styles.draftInfo}>
                <View style={[styles.subjectBadge, { backgroundColor: (item.subjectColor || Colors.accent.blue) + '20' }]}>
                  <Text style={[styles.subjectBadgeText, { color: item.subjectColor || Colors.accent.blue }]}>
                    {item.subjectName}
                  </Text>
                </View>
                <Text style={styles.draftTitle} numberOfLines={2}>{item.lessonName}</Text>
              </View>
              {!isSelectMode && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteDraft(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.draftDetails}>
              <View style={styles.draftMeta}>
                <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                <Text style={styles.draftMetaText}>
                  {formatDuration(item.durationMillis)}
                </Text>
              </View>
              <View style={styles.draftMeta}>
                <Ionicons name="calendar-outline" size={14} color={Colors.text.tertiary} />
                <Text style={styles.draftMetaText}>
                  {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>

            {!isSelectMode && (
              <View style={styles.draftActions}>
                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={() => handleResumeDraft(item)}
                >
                  <Ionicons name="play-circle" size={18} color={Colors.surface} />
                  <Text style={styles.resumeButtonText}>Reprendre</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.title}>
          {isSelectMode ? `${selectedDrafts.size} sélectionné(s)` : 'Brouillons'}
        </Text>
        <TouchableOpacity
          onPress={toggleSelectMode}
          style={styles.selectButton}
        >
          {isSelectMode ? (
            <Text style={styles.selectButtonText}>Annuler</Text>
          ) : (
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text.primary} />
          )}
        </TouchableOpacity>
      </View>

      {isSelectMode && drafts.length > 0 && (
        <View style={styles.selectionToolbar}>
          <TouchableOpacity
            onPress={selectAllDrafts}
            style={styles.toolbarButton}
          >
            <Ionicons 
              name={selectedDrafts.size === drafts.length ? "checkbox" : "square-outline"} 
              size={20} 
              color={Colors.accent.blue} 
            />
            <Text style={styles.toolbarButtonText}>Tout sélectionner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteSelected}
            style={[styles.toolbarButton, styles.deleteToolbarButton]}
            disabled={selectedDrafts.size === 0}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={selectedDrafts.size === 0 ? Colors.text.tertiary : Colors.accent.red} 
            />
            <Text style={[
              styles.toolbarButtonText,
              { color: selectedDrafts.size === 0 ? Colors.text.tertiary : Colors.accent.red }
            ]}>
              Supprimer ({selectedDrafts.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  selectButton: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  draftContent: {
    flexDirection: 'row',
    padding: 16,
  },
  draftContentWithCheckbox: {
    paddingLeft: 12,
  },
  checkboxContainer: {
    paddingTop: 2,
    marginRight: 12,
  },
  draftMain: {
    flex: 1,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  draftInfo: {
    flex: 1,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  subjectBadgeText: {
    ...Typography.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  draftTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  draftDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
    paddingTop: 12,
  },
  resumeButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resumeButtonText: {
    ...Typography.callout,
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
  selectButtonText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteToolbarButton: {
    opacity: 1,
  },
  toolbarButtonText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.accent.blue,
    borderColor: Colors.accent.blue,
  },
  draftCardSelected: {
    borderColor: Colors.accent.blue,
    borderWidth: 2,
  },
});

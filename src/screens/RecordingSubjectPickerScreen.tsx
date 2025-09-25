import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Subject, RecordingDraft } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';

interface RouteParams {
  initialLessonName?: string;
}

export const RecordingSubjectPickerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { initialLessonName } = (route.params as RouteParams) || {};

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recordingDrafts, setRecordingDrafts] = useState<RecordingDraft[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [lessonName, setLessonName] = useState(initialLessonName || '');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to subjects
    const unsubscribeSubjects = DataService.subscribeToUserSubjects(user.uid, (updatedSubjects) => {
      setSubjects(updatedSubjects);
      setIsLoadingSubjects(false);
    });

    // Subscribe to recording drafts
    const unsubscribeDrafts = DataService.subscribeToRecordingDrafts(user.uid, (drafts) => {
      setRecordingDrafts(drafts);
      setIsLoadingDrafts(false);
    });

    return () => {
      unsubscribeSubjects();
      unsubscribeDrafts();
    };
  }, [user]);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  const handleStartRecording = () => {
    if (!selectedSubject || !lessonName.trim()) return;

    navigation.navigate('RecordingStudio' as never, {
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      subjectColor: selectedSubject.color,
      initialLessonName: lessonName.trim(),
    } as never);
  };

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

  const renderSubject = ({ item }: { item: Subject }) => {
    const isSelected = selectedSubject?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.subjectCard,
          isSelected && styles.subjectCardSelected,
          { borderColor: isSelected ? item.color : Colors.gray[200] }
        ]}
        onPress={() => handleSubjectSelect(item)}
      >
        <View style={[styles.subjectIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons 
            name={item.icon || 'book-outline'} 
            size={24} 
            color={item.color} 
          />
        </View>
        <Text style={styles.subjectName}>{item.name}</Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={item.color} />
        )}
      </TouchableOpacity>
    );
  };

  const renderDraft = ({ item }: { item: RecordingDraft }) => {
    const duration = Math.floor(item.durationMillis / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return (
      <TouchableOpacity
        style={styles.draftCard}
        onPress={() => handleResumeDraft(item)}
      >
        <View style={[styles.draftIcon, { backgroundColor: (item.subjectColor || Colors.accent.blue) + '20' }]}>
          <Ionicons name="mic" size={20} color={item.subjectColor || Colors.accent.blue} />
        </View>
        <View style={styles.draftContent}>
          <Text style={styles.draftTitle} numberOfLines={1}>{item.lessonName}</Text>
          <Text style={styles.draftSubtitle}>
            {item.subjectName} • {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        </View>
        <Ionicons name="play-circle" size={24} color={Colors.accent.blue} />
      </TouchableOpacity>
    );
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
        <Text style={styles.title}>Nouvel enregistrement</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Recording Drafts */}
        {recordingDrafts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brouillons</Text>
            {isLoadingDrafts ? (
              <ActivityIndicator size="small" color={Colors.accent.blue} />
            ) : (
              <FlatList
                data={recordingDrafts}
                renderItem={renderDraft}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.draftsList}
              />
            )}
          </View>
        )}

        {/* Lesson Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom de la leçon</Text>
          <TextInput
            style={styles.input}
            value={lessonName}
            onChangeText={setLessonName}
            placeholder="Ex: Cours de biologie cellulaire"
            placeholderTextColor={Colors.text.tertiary}
          />
        </View>

        {/* Subject Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélectionner une matière</Text>
          {isLoadingSubjects ? (
            <ActivityIndicator size="small" color={Colors.accent.blue} />
          ) : subjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>Aucune matière trouvée</Text>
              <TouchableOpacity
                style={styles.createSubjectButton}
                onPress={() => navigation.navigate('CreateSubject' as never)}
              >
                <Ionicons name="add" size={20} color={Colors.accent.blue} />
                <Text style={styles.createSubjectText}>Créer une matière</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={subjects}
              renderItem={renderSubject}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.subjectsRow}
              contentContainerStyle={styles.subjectsList}
            />
          )}
        </View>

        {/* Start Recording Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            (!selectedSubject || !lessonName.trim()) && styles.startButtonDisabled
          ]}
          onPress={handleStartRecording}
          disabled={!selectedSubject || !lessonName.trim()}
        >
          <Ionicons name="mic" size={20} color={Colors.surface} />
          <Text style={styles.startButtonText}>Commencer l'enregistrement</Text>
        </TouchableOpacity>
      </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  draftsList: {
    gap: 12,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  draftContent: {
    flex: 1,
  },
  draftTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  draftSubtitle: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    ...Typography.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  subjectsList: {
    gap: 12,
  },
  subjectsRow: {
    gap: 12,
  },
  subjectCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  subjectCardSelected: {
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
  subjectName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    ...Typography.headline,
    color: Colors.text.secondary,
    marginTop: 16,
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
  createSubjectText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.accent.red,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  startButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  startButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
});

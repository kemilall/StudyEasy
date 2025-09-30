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
import { Subject } from '../types';
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
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [lessonName, setLessonName] = useState(initialLessonName || '');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to subjects
    const unsubscribeSubjects = DataService.subscribeToUserSubjects(user.uid, (updatedSubjects) => {
      setSubjects(updatedSubjects);
      setIsLoadingSubjects(false);
    });

    return () => {
      unsubscribeSubjects();
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


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouvel enregistrement</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Drafts' as never)}
          style={styles.draftsButton}
        >
          <Ionicons name="document-outline" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
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

      </View>

      {/* Start Recording Button */}
      <View style={styles.bottomContainer}>
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
  draftsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  bottomContainer: {
    padding: 24,
    paddingTop: 0,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
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

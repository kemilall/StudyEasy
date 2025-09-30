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
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Subject } from '../types';

export const CreateLessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const [lessonName, setLessonName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
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

  const handleCreate = async () => {
    if (!lessonName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le chapitre.');
      return;
    }

    const subjectIdToUse = selectedSubject?.id || routeSubjectId;
    if (!subjectIdToUse) {
      Alert.alert('Erreur', 'Matière introuvable.');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un chapitre.');
      return;
    }

    // Do not save here; go to AudioImport to collect audio and process
    navigation.navigate('RecordingStudio' as never, {
      subjectId: subjectIdToUse,
      subjectName: selectedSubject?.name || 'Matière',
      subjectColor: selectedSubject?.color,
      initialLessonName: lessonName.trim(),
    } as never);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouvelle leçon</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          style={[styles.saveButton, (!lessonName.trim() || !selectedSubject) && styles.saveButtonDisabled]}
          disabled={!lessonName.trim() || !selectedSubject}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={[styles.saveButtonText, (!lessonName.trim() || !selectedSubject || isCreating) && styles.saveButtonTextDisabled]}>
              Créer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélection de matière (masquée si subjectId est fourni) */}
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
              <FlatList
                data={subjects}
                renderItem={renderSubjectItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.subjectsList}
              />
            )}
          </View>
        )}

        {/* Informations de la leçon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de la leçon *</Text>
            <TextInput
              style={styles.textInput}
              value={lessonName}
              onChangeText={setLessonName}
              placeholder="Ex: Algèbre linéaire"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez brièvement cette leçon..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Aperçu */}
        {selectedSubject && lessonName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aperçu</Text>
            <View style={[styles.previewCard, { backgroundColor: selectedSubject.color + '10' }]}>
              <View style={[styles.previewIcon, { backgroundColor: selectedSubject.color + '20' }]}>
                <Ionicons name="book" size={24} color={selectedSubject.color} />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewSubject}>{selectedSubject.name}</Text>
                <Text style={styles.previewName}>{lessonName}</Text>
                <Text style={styles.previewChapters}>0 chapitres</Text>
              </View>
            </View>
          </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
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
    height: 80,
    textAlignVertical: 'top',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewContent: {
    flex: 1,
  },
  previewSubject: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  previewName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  previewChapters: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
});
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
import { mockSubjects } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

type CreateLessonScreenRouteProp = RouteProp<{ params: { subjectId?: string } }, 'params'>;

export const CreateLessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateLessonScreenRouteProp>();
  const subjectId = route.params?.subjectId;
  
  const [lessonName, setLessonName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(
    subjectId ? mockSubjects.find(s => s.id === subjectId) : mockSubjects[0]
  );

  const handleCreate = () => {
    if (!lessonName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la leçon.');
      return;
    }

    if (!selectedSubject) {
      Alert.alert('Erreur', 'Veuillez sélectionner une matière.');
      return;
    }

    Alert.alert(
      'Leçon créée !',
      `La leçon "${lessonName}" a été créée dans ${selectedSubject.name}.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
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
        <Text style={styles.title}>Nouvelle leçon</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          style={[styles.saveButton, !lessonName.trim() && styles.saveButtonDisabled]}
          disabled={!lessonName.trim()}
        >
          <Text style={[styles.saveButtonText, !lessonName.trim() && styles.saveButtonTextDisabled]}>
            Créer
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prévisualisation */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewName}>
                {lessonName || 'Nom de la leçon'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </View>
            
            <View style={styles.previewInfo}>
              <View style={styles.previewInfoItem}>
                <Ionicons name="book-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.previewInfoText}>0 chapitres</Text>
              </View>
              <View style={styles.previewInfoItem}>
                <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.previewInfoText}>0 min</Text>
              </View>
            </View>
            
            <View style={styles.previewProgress}>
              <View style={styles.previewProgressBar}>
                <View style={styles.previewProgressFill} />
              </View>
              <Text style={styles.previewProgressText}>0%</Text>
            </View>
          </View>
        </View>

        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de la leçon *</Text>
            <TextInput
              style={styles.textInput}
              value={lessonName}
              onChangeText={setLessonName}
              placeholder="Ex: Algèbre Linéaire"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez le contenu de cette leçon..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Sélection de matière */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matière</Text>
          <View style={styles.subjectsContainer}>
            {mockSubjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectOption,
                  { backgroundColor: subject.color + '15' },
                  selectedSubject?.id === subject.id && styles.subjectOptionSelected,
                ]}
                onPress={() => setSelectedSubject(subject)}
              >
                <View style={[styles.subjectIcon, { backgroundColor: subject.color + '25' }]}>
                  <Ionicons name="book" size={20} color={subject.color} />
                </View>
                <Text style={styles.subjectName}>{subject.name}</Text>
                {selectedSubject?.id === subject.id && (
                  <Ionicons name="checkmark-circle" size={20} color={subject.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Après création</Text>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="add-circle-outline" size={24} color={Colors.accent.blue} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Créer le premier chapitre</Text>
              <Text style={styles.quickActionSubtitle}>Commencez directement par ajouter du contenu</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
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
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewName: {
    ...Typography.headline,
    color: Colors.text.primary,
    flex: 1,
  },
  previewInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  previewInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewInfoText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  previewProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  previewProgressFill: {
    width: '0%',
    height: '100%',
    backgroundColor: Colors.accent.blue,
    borderRadius: 3,
  },
  previewProgressText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
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
  subjectsContainer: {
    gap: 12,
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subjectOptionSelected: {
    borderColor: Colors.accent.blue,
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
    ...Typography.headline,
    color: Colors.text.primary,
    flex: 1,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
});


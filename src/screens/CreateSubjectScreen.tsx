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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';

const SUBJECT_COLORS = [
  Colors.accent.blue,
  Colors.accent.green,
  Colors.accent.orange,
  Colors.accent.red,
  Colors.accent.purple,
  Colors.accent.yellow,
  Colors.accent.teal,
];

const SUBJECT_ICONS = [
  'book-outline',
  'calculator-outline',
  'flask-outline',
  'planet-outline',
  'language-outline',
  'musical-notes-outline',
  'brush-outline',
  'fitness-outline',
  'library-outline',
  'leaf-outline',
  'code-slash-outline',
  'earth-outline',
];

export const CreateSubjectScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [subjectName, setSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!subjectName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la matière.');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer une matière.');
      return;
    }

    setIsCreating(true);
    try {
      await DataService.createSubject(user.uid, {
        name: subjectName.trim(),
        color: selectedColor,
        icon: selectedIcon,
        lessonsCount: 0,
        completedLessons: 0,
      });

      // Navigate back to the previous screen (usually the subjects list)
      navigation.goBack();
    } catch (error) {
      console.error('Error creating subject:', error);
      Alert.alert('Erreur', 'Impossible de créer la matière. Veuillez réessayer.');
    } finally {
      setIsCreating(false);
    }
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
        <Text style={styles.title}>Nouvelle matière</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          style={[styles.saveButton, (!subjectName.trim() || isCreating) && styles.saveButtonDisabled]}
          disabled={!subjectName.trim() || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={[styles.saveButtonText, (!subjectName.trim() || isCreating) && styles.saveButtonTextDisabled]}>
              Créer
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de la matière *</Text>
            <TextInput
              style={styles.textInput}
              value={subjectName}
              onChangeText={setSubjectName}
              placeholder="Ex: Mathématiques"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez brièvement cette matière..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Couleur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couleur</Text>
          <View style={styles.colorGrid}>
            {SUBJECT_COLORS.map((color, index) => (
              <TouchableOpacity
                key={`color-${index}-${color}`}
                style={[
                  styles.colorOption,
                  { backgroundColor: color + '20' },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                <View style={[styles.colorCircle, { backgroundColor: color }]} />
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={16} color={color} style={styles.colorCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Icône */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icône</Text>
          <View style={styles.iconGrid}>
            {SUBJECT_ICONS.map((icon, index) => (
              <TouchableOpacity
                key={`icon-${index}-${icon}`}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons 
                  name={icon as any} 
                  size={24} 
                  color={selectedIcon === icon ? selectedColor : Colors.text.secondary} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
    fontWeight: '700',
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  colorOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 6,
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.text.primary,
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  iconOption: {
    width: 64,
    height: 64,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    margin: 6,
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  iconOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '10',
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
});


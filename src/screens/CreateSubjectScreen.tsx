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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const SUBJECT_COLORS = [
  Colors.accent.blue,
  Colors.accent.green,
  Colors.accent.orange,
  Colors.accent.red,
  Colors.accent.purple,
  Colors.accent.pink,
  Colors.accent.teal,
];

const SUBJECT_ICONS = [
  'book',
  'calculator',
  'flask',
  'telescope',
  'language',
  'musical-notes',
  'palette',
  'fitness',
];

export const CreateSubjectScreen: React.FC = () => {
  const navigation = useNavigation();
  const [subjectName, setSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(SUBJECT_ICONS[0]);
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!subjectName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la matière.');
      return;
    }

    Alert.alert(
      'Matière créée !',
      `La matière "${subjectName}" a été créée avec succès.`,
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
        <Text style={styles.title}>Nouvelle matière</Text>
        <TouchableOpacity 
          onPress={handleCreate}
          style={[styles.saveButton, !subjectName.trim() && styles.saveButtonDisabled]}
          disabled={!subjectName.trim()}
        >
          <Text style={[styles.saveButtonText, !subjectName.trim() && styles.saveButtonTextDisabled]}>
            Créer
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prévisualisation */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={[styles.previewCard, { backgroundColor: selectedColor + '15' }]}>
            <View style={[styles.previewIcon, { backgroundColor: selectedColor + '25' }]}>
              <Ionicons name={selectedIcon as any} size={24} color={selectedColor} />
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewName}>
                {subjectName || 'Nom de la matière'}
              </Text>
              <Text style={styles.previewLessons}>0 leçons</Text>
            </View>
          </View>
        </View>

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
            {SUBJECT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
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
            {SUBJECT_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
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
  previewName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  previewLessons: {
    ...Typography.caption1,
    color: Colors.text.secondary,
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
    gap: 12,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.text.primary,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 60,
    height: 60,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  iconOptionSelected: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '10',
  },
});


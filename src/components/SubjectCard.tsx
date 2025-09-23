import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subject } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DoubleConfirmationModal } from './DoubleConfirmationModal';

interface SubjectCardProps {
  subject: Subject;
  onPress: () => void;
  onDelete?: () => void;
  editMode?: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onPress, onDelete, editMode = false }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const progress = (subject.lessonsCount || 0) > 0 
    ? ((subject.completedLessons || 0) / (subject.lessonsCount || 1)) * 100 
    : 0;

  const handleDelete = () => {
    setShowDeleteModal(false);
    onDelete?.();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: subject.color + '10' }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: subject.color }]}>
              {subject.name}
            </Text>
            {editMode && onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setShowDeleteModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={16} 
                  color={Colors.accent.red} 
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.stats}>
            {subject.completedLessons || 0} / {subject.lessonsCount || 0} chapitres
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progress}%`, backgroundColor: subject.color }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>

      <DoubleConfirmationModal
        visible={showDeleteModal}
        title="Supprimer la matière"
        message={`Vous êtes sur le point de supprimer la matière "${subject.name}".`}
        warningMessage="Cette action est irréversible ! Toutes les leçons et chapitres associés seront définitivement supprimés."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1.25,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    ...Typography.title3,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: Colors.surface + '80',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  stats: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBackground: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

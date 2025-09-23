import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lesson } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DoubleConfirmationModal } from './DoubleConfirmationModal';

interface LessonCardProps {
  lesson: Lesson;
  onPress: () => void;
  onDelete?: () => void;
  editMode?: boolean;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onPress, onDelete, editMode = false }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const progress = (lesson.chaptersCount || 0) > 0 
    ? ((lesson.completedChapters || 0) / (lesson.chaptersCount || 1)) * 100 
    : 0;

  const handleDelete = () => {
    setShowDeleteModal(false);
    onDelete?.();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{lesson.name}</Text>
            <View style={styles.headerActions}>
              {editMode && onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setShowDeleteModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={18} 
                    color={Colors.accent.red} 
                  />
                </TouchableOpacity>
              )}
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={Colors.text.tertiary} 
              />
            </View>
          </View>
        
        <View style={styles.info}>
          <View style={styles.infoItem}>
            <Ionicons 
              name="book-outline" 
              size={16} 
              color={Colors.text.secondary} 
            />
            <Text style={styles.infoText}>
              {lesson.completedChapters || 0}/{lesson.chaptersCount || 0} leçons
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={Colors.text.secondary} 
            />
            <Text style={styles.infoText}>
              {lesson.duration || 0} min
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      </View>
    </TouchableOpacity>

    <DoubleConfirmationModal
      visible={showDeleteModal}
      title="Supprimer la leçon"
      message={`Vous êtes sur le point de supprimer la leçon "${lesson.name}".`}
      warningMessage="Cette action est irréversible ! Tous les chapitres associés seront également supprimés définitivement."
      onConfirm={handleDelete}
      onCancel={() => setShowDeleteModal(false)}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    ...Typography.headline,
    color: Colors.text.primary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: Colors.accent.red + '10',
  },
  info: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
    borderRadius: 3,
  },
  progressText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});

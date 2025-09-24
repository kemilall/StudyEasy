import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subject } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface SubjectCardProps {
  subject: Subject;
  onPress: () => void;
  onDelete?: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onPress, onDelete }) => {

  // Get appropriate icon - use saved icon or fallback to name-based logic
  const getSubjectIcon = (subject: Subject) => {
    if (subject.icon) {
      return subject.icon;
    }

    // Fallback to name-based logic for existing subjects without icons
    const lowercaseName = subject.name.toLowerCase();
    if (lowercaseName.includes('math')) return 'calculator-outline';
    if (lowercaseName.includes('physi')) return 'planet-outline';
    if (lowercaseName.includes('chimi')) return 'flask-outline';
    if (lowercaseName.includes('histoi')) return 'library-outline';
    if (lowercaseName.includes('géo')) return 'earth-outline';
    if (lowercaseName.includes('bio')) return 'leaf-outline';
    if (lowercaseName.includes('info')) return 'code-slash-outline';
    if (lowercaseName.includes('anglais') || lowercaseName.includes('english')) return 'language-outline';
    return 'book-outline';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: subject.color + '15' }]}>
        <Ionicons
          name={getSubjectIcon(subject) as any}
          size={32}
          color={subject.color}
        />
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {subject.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
});

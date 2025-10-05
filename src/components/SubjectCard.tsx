import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
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
      style={[styles.container, subject.isDeleting && styles.deleting]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={subject.isDeleting}
    >
      {/* Decorative Waves at Top */}
      <View style={styles.wavesContainer}>
        <Svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none" style={styles.waves}>
          <Path
            d="M0,20 Q25,10 50,20 T100,20 T150,20 T200,20 L200,0 L0,0 Z"
            fill={subject.color}
            opacity={0.08}
          />
          <Path
            d="M0,25 Q25,15 50,25 T100,25 T150,25 T200,25 L200,0 L0,0 Z"
            fill={subject.color}
            opacity={0.06}
          />
          <Path
            d="M0,30 Q25,20 50,30 T100,30 T150,30 T200,30 L200,0 L0,0 Z"
            fill={subject.color}
            opacity={0.04}
          />
        </Svg>
      </View>

      {subject.isDeleting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={subject.color} />
          <Text style={styles.deletingText}>Suppression...</Text>
        </View>
      )}
      
      <View style={[styles.iconContainer, { backgroundColor: subject.color + '15' }, subject.isDeleting && styles.fadedContent]}>
        <Ionicons
          name={getSubjectIcon(subject) as any}
          size={32}
          color={subject.color}
        />
      </View>

      <Text style={[styles.name, subject.isDeleting && styles.fadedContent]} numberOfLines={2}>
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
    overflow: 'hidden',
  },
  wavesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 0,
  },
  waves: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  deleting: {
    opacity: 0.9,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: 8,
  },
  fadedContent: {
    opacity: 0.3,
  },
  deletingText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});

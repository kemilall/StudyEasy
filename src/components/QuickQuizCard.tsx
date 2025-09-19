import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface QuickQuizCardProps {
  subject: string;
  questionsCount: number;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  estimatedTime: number;
  onPress: () => void;
}

export const QuickQuizCard: React.FC<QuickQuizCardProps> = ({
  subject,
  questionsCount,
  difficulty,
  estimatedTime,
  onPress,
}) => {
  const getDifficultyConfig = () => {
    switch (difficulty) {
      case 'Facile':
        return { color: Colors.accent.green, icon: 'leaf-outline' };
      case 'Moyen':
        return { color: Colors.accent.orange, icon: 'flash-outline' };
      case 'Difficile':
        return { color: Colors.accent.red, icon: 'flame-outline' };
    }
  };

  const config = getDifficultyConfig();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
            <Ionicons name={config.icon as any} size={24} color={config.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.subject} numberOfLines={1}>{subject}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{questionsCount} questions</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{estimatedTime} min</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={[styles.difficultyBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={[styles.difficultyText, { color: config.color }]}>
              {difficulty}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: config.color }]} 
            onPress={onPress}
          >
            <Text style={styles.startButtonText}>Commencer</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 24,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  subject: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  metaDot: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
    marginHorizontal: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  startButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
});
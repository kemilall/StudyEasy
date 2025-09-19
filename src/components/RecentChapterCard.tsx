import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface RecentChapterCardProps {
  chapterName: string;
  lessonName: string;
  subjectName: string;
  progress: number;
  onPress: () => void;
}

export const RecentChapterCard: React.FC<RecentChapterCardProps> = ({
  chapterName,
  lessonName,
  subjectName,
  progress,
  onPress,
}) => {
  const getSubjectColor = () => {
    // Simple color assignment based on subject name
    if (subjectName.includes('Math')) return Colors.accent.blue;
    if (subjectName.includes('Phys')) return Colors.accent.green;
    if (subjectName.includes('Chim')) return Colors.accent.orange;
    return Colors.accent.purple;
  };

  const subjectColor = getSubjectColor();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.colorAccent, { backgroundColor: subjectColor }]} />
      
      <View style={styles.content}>
        <View style={[styles.subjectTag, { backgroundColor: subjectColor + '15' }]}>
          <Text style={[styles.subjectTagText, { color: subjectColor }]}>
            {subjectName}
          </Text>
        </View>
        
        <Text style={styles.chapterName} numberOfLines={2}>{chapterName}</Text>
        <Text style={styles.lessonName} numberOfLines={1}>{lessonName}</Text>
        
        <View style={styles.footer}>
          <View style={styles.timeInfo}>
            <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
            <Text style={styles.timeText}>Il y a 2h</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color={subjectColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  colorAccent: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  subjectTagText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  chapterName: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  lessonName: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
});
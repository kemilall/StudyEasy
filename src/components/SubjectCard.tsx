import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Subject } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface SubjectCardProps {
  subject: Subject;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onPress }) => {
  const progress = subject.lessonsCount > 0 
    ? (subject.completedLessons / subject.lessonsCount) * 100 
    : 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: subject.color + '10' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={[styles.name, { color: subject.color }]}>
          {subject.name}
        </Text>
        <Text style={styles.stats}>
          {subject.completedLessons} / {subject.lessonsCount} chapitres
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
  name: {
    ...Typography.title3,
    marginBottom: 8,
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

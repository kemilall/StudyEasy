import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2; // 20px padding on each side + 12px gap

interface CourseCardProps {
  subject: string;
  title: string;
  date: string;
  progress: number;
  color: string;
  height?: number;
  onPress: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  subject,
  title,
  date,
  progress,
  color,
  height = 160,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { height }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View>
          <View style={[styles.subjectBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.subjectText, { color }]} numberOfLines={1}>
              {subject}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.date}>{date}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  subjectText: {
    ...Typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
    lineHeight: 24,
  },
  footer: {
    marginTop: 12,
  },
  date: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
    marginBottom: 8,
  },
  progressContainer: {
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

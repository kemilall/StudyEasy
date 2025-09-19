import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
}

export const StreakCard: React.FC<StreakCardProps> = ({ currentStreak, bestStreak }) => {
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const today = new Date().getDay();
  const mondayFirst = today === 0 ? 6 : today - 1; // Adjust for Monday first

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="flame" size={24} color={Colors.accent.orange} />
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>jours d'affilée</Text>
        </View>
      </View>

      <View style={styles.weekContainer}>
        {weekDays.map((day, index) => {
          const isActive = index <= mondayFirst;
          const isToday = index === mondayFirst;
          
          return (
            <View key={index} style={styles.dayWrapper}>
              <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                {day}
              </Text>
              <View 
                style={[
                  styles.dayCircle,
                  isActive && styles.dayCircleActive,
                  isToday && styles.dayCircleToday,
                ]}
              >
                {isActive && (
                  <Ionicons 
                    name="checkmark" 
                    size={12} 
                    color={Colors.surface} 
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.bestStreakText}>
          Record: {bestStreak} jours
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accent.orange + '10',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.orange + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    ...Typography.title1,
    color: Colors.accent.orange,
    fontWeight: '700',
  },
  streakLabel: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
    marginBottom: 8,
  },
  dayLabelActive: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: Colors.accent.orange,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: Colors.accent.orange,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.accent.orange + '20',
  },
  bestStreakText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
});


import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { mockChapters } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';

type ChapterScreenRouteProp = RouteProp<RootStackParamList, 'Chapter'>;
type ChapterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chapter'>;

export const ChapterScreen: React.FC = () => {
  const navigation = useNavigation<ChapterScreenNavigationProp>();
  const route = useRoute<ChapterScreenRouteProp>();
  const { chapterId } = route.params;

  const chapter = mockChapters.find(c => c.id === chapterId);

  if (!chapter || !chapter.summary) {
    return null;
  }

  const features = [
    {
      icon: 'document-text-outline',
      title: 'Transcription',
      subtitle: 'Texte complet du cours',
      color: Colors.accent.blue,
      onPress: () => navigation.navigate('Transcription', { chapterId }),
    },
    {
      icon: 'albums-outline',
      title: 'Flashcards',
      subtitle: `${chapter.flashcards?.length || 0} cartes`,
      color: Colors.accent.green,
      onPress: () => navigation.navigate('Flashcards', { chapterId }),
    },
    {
      icon: 'help-circle-outline',
      title: 'Quiz',
      subtitle: `${chapter.quiz?.length || 0} questions`,
      color: Colors.accent.orange,
      onPress: () => navigation.navigate('Quiz', { chapterId }),
    },
    {
      icon: 'chatbubble-outline',
      title: 'Chat IA',
      subtitle: 'Poser des questions',
      color: Colors.accent.purple,
      onPress: () => navigation.navigate('Chat', { chapterId }),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={styles.title}>{chapter.name}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.metaText}>{chapter.duration} min</Text>
            </View>
            {chapter.isCompleted && (
              <View style={styles.metaItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.accent.green} />
                <Text style={[styles.metaText, { color: Colors.accent.green }]}>
                  Complété
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Résumé</Text>
            <Text style={styles.summary}>{chapter.summary}</Text>
          </View>

          <View style={styles.bulletPointsContainer}>
            <Text style={styles.sectionTitle}>Points clés</Text>
            {chapter.bulletPoints?.map((point, index) => (
              <View key={index} style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Ressources</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureCard}
                  onPress={feature.onPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                    <Ionicons 
                      name={feature.icon as any} 
                      size={24} 
                      color={feature.color} 
                    />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  summaryContainer: {
    marginBottom: 32,
  },
  summary: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  bulletPointsContainer: {
    marginBottom: 32,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text.secondary,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureSubtitle: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
});

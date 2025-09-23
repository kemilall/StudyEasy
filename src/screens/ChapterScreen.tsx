import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Chapter } from '../types';

export const ChapterScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { chapterId } = route.params as { chapterId: string };
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !chapterId) return;

    const loadChapter = async () => {
      try {
        const chapterData = await DataService.getChapter(chapterId);
        setChapter(chapterData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading chapter:', error);
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [user, chapterId]);

  const markAsCompleted = async () => {
    if (!chapter) return;
    
    try {
      await DataService.updateChapter(chapterId, { isCompleted: true });
      setChapter({ ...chapter, isCompleted: true });
    } catch (error) {
      console.error('Error marking chapter as completed:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chapter) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.accent.red} />
          <Text style={styles.errorTitle}>Chapitre non trouvé</Text>
          <Text style={styles.errorSubtitle}>Ce chapitre n'existe pas ou a été supprimé</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{chapter.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {chapter.isProcessing ? (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.accent.blue} />
            <Text style={styles.processingTitle}>Traitement en cours...</Text>
            <Text style={styles.processingSubtitle}>
              Votre contenu est en cours de traitement par l'IA. Cela peut prendre quelques minutes.
            </Text>
          </View>
        ) : (
          <>
            {/* Status Card */}
            <View style={[styles.statusCard, chapter.isCompleted && styles.completedCard]}>
              <View style={styles.statusIcon}>
                <Ionicons 
                  name={chapter.isCompleted ? "checkmark-circle" : "time-outline"} 
                  size={24} 
                  color={chapter.isCompleted ? Colors.accent.green : Colors.accent.orange} 
                />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>
                  {chapter.isCompleted ? 'Chapitre terminé' : 'En cours'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {chapter.duration > 0 ? `${chapter.duration} minutes` : 'Durée inconnue'}
                </Text>
              </View>
              {!chapter.isCompleted && (
                <TouchableOpacity style={styles.completeButton} onPress={markAsCompleted}>
                  <Text style={styles.completeButtonText}>Terminer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Summary */}
            {chapter.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Résumé</Text>
                <View style={styles.card}>
                  <Text style={styles.summaryText}>{chapter.summary}</Text>
                </View>
              </View>
            )}

            {/* Key Points */}
            {chapter.bulletPoints && chapter.bulletPoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Points clés</Text>
                <View style={styles.card}>
                  {chapter.bulletPoints.map((point, index) => (
                    <View key={index} style={styles.bulletPoint}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>{point}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Cards */}
            <View style={styles.actionsGrid}>
              {chapter.transcription && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Transcription' as never, { chapterId })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.accent.purple + '15' }]}>
                    <Ionicons name="document-text" size={24} color={Colors.accent.purple} />
                  </View>
                  <Text style={styles.actionTitle}>Transcription</Text>
                  <Text style={styles.actionSubtitle}>Texte complet</Text>
                </TouchableOpacity>
              )}

              {chapter.flashcards && chapter.flashcards.length > 0 && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Flashcards' as never, { chapterId })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.accent.blue + '15' }]}>
                    <Ionicons name="albums" size={24} color={Colors.accent.blue} />
                  </View>
                  <Text style={styles.actionTitle}>Flashcards</Text>
                  <Text style={styles.actionSubtitle}>{chapter.flashcards.length} cartes</Text>
                </TouchableOpacity>
              )}

              {chapter.quiz && chapter.quiz.length > 0 && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Quiz' as never, { chapterId })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.accent.green + '15' }]}>
                    <Ionicons name="help-circle" size={24} color={Colors.accent.green} />
                  </View>
                  <Text style={styles.actionTitle}>Quiz</Text>
                  <Text style={styles.actionSubtitle}>{chapter.quiz.length} questions</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Chat' as never, { chapterId })}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.accent.orange + '15' }]}>
                  <Ionicons name="chatbubble" size={24} color={Colors.accent.orange} />
                </View>
                <Text style={styles.actionTitle}>Chat IA</Text>
                <Text style={styles.actionSubtitle}>Posez vos questions</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  errorSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  processingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  processingTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  completedCard: {
    backgroundColor: Colors.accent.green + '10',
  },
  statusIcon: {
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statusSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  completeButton: {
    backgroundColor: Colors.accent.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  completeButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.blue,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
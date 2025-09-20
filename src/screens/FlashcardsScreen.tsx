import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { Flashcard } from '../types';
import { fetchFlashcards } from '../api/backend';

type FlashcardsScreenRouteProp = RouteProp<RootStackParamList, 'Flashcards'>;
type FlashcardsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Flashcards'>;

const { width } = Dimensions.get('window');

export const FlashcardsScreen: React.FC = () => {
  const navigation = useNavigation<FlashcardsScreenNavigationProp>();
  const route = useRoute<FlashcardsScreenRouteProp>();
  const { chapterId } = route.params;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlashcards = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await fetchFlashcards(chapterId);
      setFlashcards(data);
      setCurrentIndex(0);
      setIsRevealed(false);
    } catch (_err) {
      setError("Impossible de charger les flashcards.");
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
    }
  };

  const handleReveal = () => {
    setIsRevealed((prev) => !prev);
  };

  if (isLoading && flashcards.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent.blue} />
      </SafeAreaView>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Flashcards</Text>
        
        <TouchableOpacity style={styles.refreshButton} onPress={loadFlashcards}>
          <Ionicons name="refresh" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={Colors.accent.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {flashcards.length === 0 && !isLoading ? (
        <View style={[styles.centered, { paddingHorizontal: 32 }] }>
          <Ionicons name="albums-outline" size={32} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Aucune flashcard disponible</Text>
          <Text style={styles.emptySubtitle}>Générez du contenu pour ce chapitre afin d'obtenir des cartes de révision.</Text>
        </View>
      ) : null}

      {flashcards.length > 0 && currentCard && (
        <>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentIndex + 1} / {flashcards.length}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentIndex + 1) / flashcards.length) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <ScrollView 
            style={styles.cardContainer}
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={handleReveal}
              activeOpacity={0.9}
            >
              <View style={styles.cardInner}>
                <Text style={styles.cardLabel}>
                  {isRevealed ? 'Réponse' : 'Question'}
                </Text>
                <Text style={styles.cardText}>
                  {isRevealed ? currentCard.answer : currentCard.question}
                </Text>
              </View>
              
              <View style={styles.tapHint}>
                <Ionicons 
                  name="hand-left-outline" 
                  size={20} 
                  color={Colors.text.tertiary} 
                />
                <Text style={styles.tapHintText}>
                  Toucher pour {isRevealed ? 'voir la question' : 'révéler'}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                currentIndex === 0 && styles.controlButtonDisabled
              ]}
              onPress={handlePrevious}
              disabled={currentIndex === 0}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={currentIndex === 0 ? Colors.text.tertiary : Colors.text.primary} 
              />
              <Text style={[
                styles.controlText,
                currentIndex === 0 && styles.controlTextDisabled
              ]}>
                Précédent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                currentIndex === flashcards.length - 1 && styles.controlButtonDisabled
              ]}
              onPress={handleNext}
              disabled={currentIndex === flashcards.length - 1}
            >
              <Text style={[
                styles.controlText,
                currentIndex === flashcards.length - 1 && styles.controlTextDisabled
              ]}>
                Suivant
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={currentIndex === flashcards.length - 1 ? Colors.text.tertiary : Colors.text.primary} 
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.accent.red + '10',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.accent.red,
    flex: 1,
  },
  emptyTitle: {
    ...Typography.headline,
    color: Colors.text.secondary,
  },
  emptySubtitle: {
    ...Typography.subheadline,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  progressText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  cardContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  card: {
    width: width - 48,
    minHeight: 320,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  cardLabel: {
    ...Typography.footnote,
    color: Colors.accent.blue,
    letterSpacing: 1,
  },
  cardText: {
    ...Typography.title2,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  tapHintText: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  controlButtonDisabled: {
    backgroundColor: Colors.gray[100],
  },
  controlText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  controlTextDisabled: {
    color: Colors.text.tertiary,
  },
});

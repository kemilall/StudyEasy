import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  PanGesturer,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson, Flashcard } from '../types';

export const FlashcardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId } = route.params as { lessonId: string };

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const flipAnimation = new Animated.Value(0);

  useEffect(() => {
    if (!user || !lessonId) return;

    const loadLesson = async () => {
      try {
        const lessonData = await DataService.getLesson(lessonId);
        setLesson(lessonData);
        if (lessonData?.flashcards) {
          setFlashcards(lessonData.flashcards);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading lesson:', error);
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [user, lessonId]);

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !flashcards.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="albums-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.errorTitle}>Aucune flashcard</Text>
          <Text style={styles.errorSubtitle}>
            Les flashcards de cette leçon ne sont pas encore prêtes
          </Text>
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

  const currentCard = flashcards[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Flashcards</Text>
        <View style={styles.placeholder} />
      </View>

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

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.cardTouchable} onPress={flipCard}>
          <Animated.View 
            style={[
              styles.card, 
              styles.cardFront,
              { transform: [{ rotateY: frontInterpolate }] }
            ]}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Question</Text>
              <Text style={styles.cardText}>{currentCard.question}</Text>
            </View>
            <View style={styles.flipHint}>
              <Ionicons name="refresh" size={20} color={Colors.text.tertiary} />
              <Text style={styles.flipHintText}>Touchez pour révéler</Text>
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.card, 
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] }
            ]}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>Réponse</Text>
              <Text style={styles.cardText}>{currentCard.answer}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, currentIndex === 0 && styles.controlButtonDisabled]}
          onPress={previousCard}
          disabled={currentIndex === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentIndex === 0 ? Colors.text.tertiary : Colors.text.primary} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipButton} onPress={flipCard}>
          <Ionicons name="refresh" size={24} color={Colors.accent.blue} />
          <Text style={styles.flipButtonText}>Retourner</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, currentIndex === flashcards.length - 1 && styles.controlButtonDisabled]}
          onPress={nextCard}
          disabled={currentIndex === flashcards.length - 1}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={currentIndex === flashcards.length - 1 ? Colors.text.tertiary : Colors.text.primary} 
          />
        </TouchableOpacity>
      </View>
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
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
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
    lineHeight: 22,
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  cardTouchable: {
    height: 400,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: Colors.surface,
  },
  cardBack: {
    backgroundColor: Colors.accent.blue + '10',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardLabel: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    ...Typography.title3,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flipHintText: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: Colors.gray[100],
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.blue + '15',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  flipButtonText: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});
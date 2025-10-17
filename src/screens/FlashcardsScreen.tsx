import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson, Flashcard } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FlashcardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId } = route.params as { lessonId: string };

  // State management
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [unknownCards, setUnknownCards] = useState<Set<string>>(new Set());
  const [sessionComplete, setSessionComplete] = useState(false);

  // Load lesson and flashcards
  useEffect(() => {
    if (!user || !lessonId) return;

    const loadLesson = async () => {
      try {
        const lessonData = await DataService.getLesson(lessonId);
        setLesson(lessonData);
        if (lessonData?.flashcards && lessonData.flashcards.length > 0) {
          setFlashcards(lessonData.flashcards);
        }
      } catch (error) {
        console.error('Error loading lesson:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [user, lessonId]);

  // Haptic feedback
  const haptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        const styles = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        Haptics.impactAsync(styles[type]);
      } catch (e) {
        // Haptics not available
      }
        } else {
      const durations = { light: 20, medium: 50, heavy: 100 };
      Vibration.vibrate(durations[type]);
    }
  };

  // Card flip handler
  const handleFlip = () => {
    haptic('light');
    setIsFlipped(!isFlipped);
  };

  // Decision handlers
  const handleKnown = () => {
    haptic('medium');
    const card = flashcards[currentIndex];
    setKnownCards(prev => new Set(prev).add(card.id));
    moveToNext();
  };

  const handleUnknown = () => {
    haptic('medium');
    const card = flashcards[currentIndex];
    setUnknownCards(prev => new Set(prev).add(card.id));
    moveToNext();
  };

  // Move to next card
  const moveToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
    }
  };

  // Reset session
  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
    setSessionComplete(false);
  };

  // Review unknown cards
  const reviewUnknown = () => {
    const unknownList = flashcards.filter(card => unknownCards.has(card.id));
    if (unknownList.length > 0) {
      setFlashcards(unknownList);
    setCurrentIndex(0);
    setIsFlipped(false);
      setKnownCards(new Set());
      setUnknownCards(new Set());
      setSessionComplete(false);
    } else {
      resetSession();
    }
  };

  // Generate HTML for WebView with MathJax
  const generateHTML = (content: string, isQuestion: boolean) => {
    const bgColor = Colors.surface;
    const textColor = Colors.text.primary;
    const labelColor = Colors.text.secondary;
    const label = isQuestion ? 'QUESTION' : 'RÉPONSE';
    
    // Process content to handle LaTeX delimiters
    const processedContent = content
      .replace(/\n/g, '<br/>')
      .replace(/\\n/g, '<br/>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
  <script>
    MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)']],
        displayMath: [['\\\\[', '\\\\]']],
        processEscapes: true,
        processEnvironments: true
      },
      svg: {
        fontCache: 'global',
        scale: 0.95,
        minScale: 0.5
      },
      startup: {
        ready: () => {
          MathJax.startup.defaultReady();
          MathJax.startup.promise.then(() => {
            // Send height after MathJax renders
            setTimeout(() => {
              const height = document.body.scrollHeight;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'height',
                value: height
              }));
            }, 100);
          });
        }
      }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: ${bgColor};
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
    body {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px 15px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .label {
      font-size: 11px;
      color: ${labelColor};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-bottom: 16px;
      text-align: center;
      flex-shrink: 0;
    }
    .content {
      font-size: 17px;
      color: ${textColor};
      line-height: 1.6;
      text-align: center;
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      width: 100%;
    }
    mjx-container {
      margin: 2px 0 !important;
      display: inline;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: visible;
      vertical-align: baseline !important;
    }
    mjx-container[display="true"] {
      display: block;
      margin: 8px 0 !important;
      max-width: 100%;
      overflow-x: auto;
    }
    mjx-container svg {
      max-width: 100%;
      height: auto;
      vertical-align: baseline !important;
    }
    mjx-container[display="true"] svg {
      vertical-align: middle !important;
    }
  </style>
</head>
<body>
  <div class="label">${label}</div>
  <div class="content">${processedContent}</div>
</body>
</html>
    `;
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.accent.blue} />
            <Text style={styles.loadingText}>Chargement des flashcards...</Text>
          </View>
      </SafeAreaView>
    );
  }

  // No flashcards state
  if (!lesson || flashcards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="school-outline" size={64} color={Colors.accent.blue} />
          <Text style={styles.emptyTitle}>Aucune flashcard disponible</Text>
          <Text style={styles.emptySubtitle}>
            Cette leçon ne contient pas encore de flashcards.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.surface} />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  // Session complete state
  if (sessionComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session terminée</Text>
          <View style={styles.backIcon} />
        </View>

        <View style={styles.centerContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Bravo ! 🎉</Text>
            <Text style={styles.summarySubtitle}>Vous avez terminé toutes les cartes</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{knownCards.size}</Text>
                <Text style={styles.statLabel}>Acquis</Text>
              </View>
              <View style={[styles.statBox, styles.statBoxUnknown]}>
                <Text style={styles.statNumber}>{unknownCards.size}</Text>
                <Text style={styles.statLabel}>À revoir</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={resetSession}>
              <Ionicons name="refresh" size={20} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>Recommencer</Text>
            </TouchableOpacity>

            {unknownCards.size > 0 && (
              <TouchableOpacity style={styles.secondaryButton} onPress={reviewUnknown}>
                <Ionicons name="school" size={20} color={Colors.accent.blue} />
                <Text style={styles.secondaryButtonText}>Revoir les cartes non acquises</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main flashcard view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <View style={styles.backIcon} />
      </View>

      {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
          {currentIndex + 1} / {flashcards.length}
          </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Flashcard */}
        <View style={styles.cardContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
          onPress={handleFlip}
          style={styles.card}
        >
          <WebView
            key={`${currentCard.id}-${isFlipped}`}
            source={{ 
              html: generateHTML(
                isFlipped ? currentCard.answer : currentCard.question,
                !isFlipped
              )
            }}
            style={styles.webview}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={false}
            startInLoadingState={false}
            onError={(e) => console.error('WebView error:', e.nativeEvent)}
            pointerEvents="none"
          />
            </TouchableOpacity>

        {/* Flip hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="refresh" size={18} color={Colors.text.tertiary} />
          <Text style={styles.hintText}>
            {!isFlipped ? 'Appuyez sur la carte pour voir la réponse' : 'Appuyez sur la carte pour revoir la question'}
          </Text>
          </View>
        </View>

      {/* Controls */}
        <View style={styles.controls}>
        {isFlipped ? (
          <>
            <TouchableOpacity style={styles.unknownButton} onPress={handleUnknown}>
              <Ionicons name="close-circle" size={28} color={Colors.surface} />
              <Text style={styles.buttonText}>À revoir</Text>
          </TouchableOpacity>
            <TouchableOpacity style={styles.knownButton} onPress={handleKnown}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.surface} />
              <Text style={styles.buttonText}>Acquis</Text>
          </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.flipButton} onPress={handleFlip}>
            <Ionicons name="eye" size={24} color={Colors.surface} />
            <Text style={styles.flipButtonText}>Révéler la réponse</Text>
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(135, 221, 231, 0.1)',
  },
  backIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  progressText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    height: SCREEN_HEIGHT * 0.52,
    maxHeight: 520,
    minHeight: 400,
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(135, 221, 231, 0.2)',
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  hintText: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  flipButton: {
    flex: 1,
    backgroundColor: Colors.accent.blue,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  flipButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  unknownButton: {
    flex: 1,
    backgroundColor: Colors.accent.red,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.accent.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  knownButton: {
    flex: 1,
    backgroundColor: Colors.accent.green,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.accent.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  emptyTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(135, 221, 231, 0.1)',
  },
  summaryTitle: {
    ...Typography.title1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  summarySubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.accent.green + '20',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent.green,
  },
  statBoxUnknown: {
    backgroundColor: Colors.accent.red + '20',
    borderColor: Colors.accent.red,
  },
  statNumber: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.accent.blue,
  },
  secondaryButtonText: {
    ...Typography.headline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});

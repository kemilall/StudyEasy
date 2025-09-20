import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { QuizQuestion } from '../types';
import { fetchQuiz } from '../api/backend';

type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;
type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;

export const QuizScreen: React.FC = () => {
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  const { chapterId } = route.params;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await fetchQuiz(chapterId);
      setQuestions(data);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setScore(0);
    } catch (_err) {
      setError('Impossible de charger le quiz.');
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1;

  const handleSelectAnswer = (index: number) => {
    if (!showExplanation) {
      setSelectedAnswer(index);
    }
  };

  const handleValidate = () => {
    if (selectedAnswer === null) {
      Alert.alert('Sélectionnez une réponse', 'Veuillez choisir une réponse avant de valider.');
      return;
    }

    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0);
      setScore(finalScore);
      Alert.alert(
        'Quiz terminé!',
        `Votre score: ${finalScore}/${questions.length}`,
        [
          { text: 'Recommencer', onPress: loadQuiz },
          { text: 'Fermer', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      const newScore = score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0);
      setScore(newScore);
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  if (isLoading && questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent.blue} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="warning" size={36} color={Colors.accent.red} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuiz}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="help-circle-outline" size={32} color={Colors.text.tertiary} />
        <Text style={styles.emptyText}>Aucune question disponible pour ce chapitre.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Quiz</Text>
        
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} / {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showResult = showExplanation;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                  showResult && isCorrect && styles.optionCorrect,
                  showResult && isSelected && !isCorrect && styles.optionIncorrect,
                ]}
                onPress={() => handleSelectAnswer(index)}
                disabled={showExplanation}
              >
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  showResult && isCorrect && styles.optionTextCorrect,
                  showResult && isSelected && !isCorrect && styles.optionTextIncorrect,
                ]}>
                  {option}
                </Text>
                {showResult && isCorrect && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
                )}
                {showResult && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explication</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!showExplanation ? (
          <TouchableOpacity
            style={[
              styles.validateButton,
              selectedAnswer === null && styles.validateButtonDisabled
            ]}
            onPress={handleValidate}
            disabled={selectedAnswer === null}
          >
            <Text style={[
              styles.validateButtonText,
              selectedAnswer === null && styles.validateButtonTextDisabled
            ]}>
              Valider
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Terminer' : 'Question suivante'}
            </Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
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
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  score: {
    ...Typography.footnote,
    color: Colors.text.secondary,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 24,
  },
  question: {
    ...Typography.title2,
    color: Colors.text.primary,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: Colors.accent.blue,
  },
  optionCorrect: {
    borderColor: Colors.accent.green,
    backgroundColor: Colors.accent.green + '10',
  },
  optionIncorrect: {
    borderColor: Colors.accent.red,
    backgroundColor: Colors.accent.red + '10',
  },
  optionText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.accent.blue,
  },
  optionTextCorrect: {
    color: Colors.accent.green,
  },
  optionTextIncorrect: {
    color: Colors.accent.red,
  },
  explanationContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  explanationTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  explanationText: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  validateButton: {
    backgroundColor: Colors.accent.blue,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  validateButtonDisabled: {
    backgroundColor: Colors.gray[200],
  },
  validateButtonText: {
    ...Typography.headline,
    color: Colors.surface,
  },
  validateButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
  nextButton: {
    backgroundColor: Colors.accent.green,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.headline,
    color: Colors.surface,
  },
  errorText: {
    ...Typography.subheadline,
    color: Colors.accent.red,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.accent.blue,
    borderRadius: 24,
  },
  retryText: {
    ...Typography.footnote,
    color: Colors.surface,
  },
  emptyText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { mockQuizQuestions } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';

type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;
type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;

export const QuizScreen: React.FC = () => {
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(mockQuizQuestions.length).fill(null)
  );

  const questions = mockQuizQuestions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

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

    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }

    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      Alert.alert(
        'Quiz terminé!',
        `Votre score: ${score}/${questions.length}`,
        [
          { text: 'Recommencer', onPress: handleRestart },
          { text: 'Terminer', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
  };

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
    ...Typography.subheadline,
    color: Colors.text.secondary,
    fontWeight: '600',
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
    paddingVertical: 32,
  },
  question: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginBottom: 32,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
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
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: Colors.accent.green,
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: Colors.accent.red,
    fontWeight: '600',
  },
  explanationContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
  },
  explanationTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  explanationText: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  validateButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  validateButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  validateButtonText: {
    ...Typography.headline,
    color: Colors.text.inverse,
  },
  validateButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
  nextButton: {
    backgroundColor: Colors.accent.green,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.headline,
    color: Colors.text.inverse,
  },
});

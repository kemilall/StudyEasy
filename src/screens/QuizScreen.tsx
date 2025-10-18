import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson, QuizQuestion } from '../types';
import { MathText } from '../components/MathText';

export const QuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId } = route.params as { lessonId: string };
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !lessonId) return;

    const loadLesson = async () => {
      try {
        const lessonData = await DataService.getLesson(lessonId);
        setLesson(lessonData);
        if (lessonData?.quiz) {
          setQuestions(lessonData.quiz);
          setSelectedAnswers(new Array(lessonData.quiz.length).fill(-1));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading lesson:', error);
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [user, lessonId]);

  const selectAnswer = (answerIndex: number) => {
    if (showResult) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const showAnswer = () => {
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowResult(false);
    }
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResult(false);
    setQuizCompleted(false);
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

  if (!lesson || !questions.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="help-circle-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.errorTitle}>Aucun quiz</Text>
          <Text style={styles.errorSubtitle}>
            Le quiz de cette leçon n'est pas encore prêt
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

  if (quizCompleted) {
    const score = getScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={styles.scoreCard}>
            <Ionicons 
              name={percentage >= 70 ? "checkmark-circle" : "close-circle"} 
              size={64} 
              color={percentage >= 70 ? Colors.accent.green : Colors.accent.red} 
            />
            <Text style={styles.scoreTitle}>Quiz terminé !</Text>
            <Text style={styles.scoreText}>
              {score} / {questions.length}
            </Text>
            <Text style={styles.percentageText}>{percentage}%</Text>
            
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
                <Ionicons name="refresh" size={20} color={Colors.surface} />
                <Text style={styles.restartButtonText}>Recommencer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.finishButton} onPress={() => navigation.goBack()}>
                <Text style={styles.finishButtonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} sur {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <MathText fontSize={18} lineHeight={26} style={styles.questionText}>
            {currentQuestion.question}
          </MathText>
        </View>

        <View style={styles.answersContainer}>
          {currentQuestion.options.map((option, index) => {
            let buttonStyle = styles.answerButton;
            let textStyle = styles.answerText;
            
            if (showResult) {
              if (index === currentQuestion.correctAnswer) {
                buttonStyle = [styles.answerButton, styles.correctAnswer];
                textStyle = [styles.answerText, styles.correctAnswerText];
              } else if (index === selectedAnswer) {
                buttonStyle = [styles.answerButton, styles.wrongAnswer];
                textStyle = [styles.answerText, styles.wrongAnswerText];
              }
            } else if (index === selectedAnswer) {
              buttonStyle = [styles.answerButton, styles.selectedAnswer];
              textStyle = [styles.answerText, styles.selectedAnswerText];
            }

            return (
              <TouchableOpacity
                key={index}
                style={buttonStyle}
                onPress={() => selectAnswer(index)}
                disabled={showResult}
              >
                <View style={styles.answerOption}>
                  <Text style={styles.answerLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <MathText fontSize={16} lineHeight={22} style={textStyle}>
                    {option}
                  </MathText>
                </View>
                {showResult && index === currentQuestion.correctAnswer && (
                  <Ionicons name="checkmark" size={20} color={Colors.accent.green} />
                )}
                {showResult && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                  <Ionicons name="close" size={20} color={Colors.accent.red} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {showResult && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>Explication</Text>
            <MathText fontSize={16} lineHeight={22} style={styles.explanationText}>
              {currentQuestion.explanation}
            </MathText>
          </View>
        )}
      </ScrollView>

      <View style={styles.controls}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={previousQuestion}>
            <Text style={styles.secondaryButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.controlsRight}>
          {!showResult && selectedAnswer !== -1 && (
            <TouchableOpacity style={styles.primaryButton} onPress={showAnswer}>
              <Text style={styles.primaryButtonText}>Valider</Text>
            </TouchableOpacity>
          )}
          
          {showResult && (
            <TouchableOpacity style={styles.primaryButton} onPress={nextQuestion}>
              <Text style={styles.primaryButtonText}>
                {currentQuestionIndex === questions.length - 1 ? 'Terminer' : 'Suivant'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  questionText: {
    ...Typography.title3,
    color: Colors.text.primary,
    lineHeight: 28,
  },
  answersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  selectedAnswer: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '10',
  },
  correctAnswer: {
    borderColor: Colors.accent.green,
    backgroundColor: Colors.accent.green + '10',
  },
  wrongAnswer: {
    borderColor: Colors.accent.red,
    backgroundColor: Colors.accent.red + '10',
  },
  answerOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  answerLetter: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  answerText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  selectedAnswerText: {
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  correctAnswerText: {
    color: Colors.accent.green,
    fontWeight: '600',
  },
  wrongAnswerText: {
    color: Colors.accent.red,
    fontWeight: '600',
  },
  explanationCard: {
    backgroundColor: Colors.accent.blue + '10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  explanationTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  explanationText: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  controlsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.gray[200],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  scoreTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  scoreText: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  percentageText: {
    ...Typography.title3,
    color: Colors.text.secondary,
    marginBottom: 32,
  },
  resultActions: {
    gap: 12,
    width: '100%',
  },
  restartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.accent.blue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  restartButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  finishButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[200],
    paddingVertical: 16,
    borderRadius: 12,
  },
  finishButtonText: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});
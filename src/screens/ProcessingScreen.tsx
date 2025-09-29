import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { AIService } from '../services/aiService';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

interface RouteParams {
  lessonId: string;
  subjectId?: string;
  audioUrl?: string;
  documentText?: string;
  localUri?: string;
  fileName?: string;
  mimeType?: string;
}

const PROCESSING_STEPS = [
  {
    id: 1,
    title: 'Analyse de l\'audio',
    subtitle: 'Extraction et optimisation du signal audio',
    icon: 'pulse',
    duration: 3000,
  },
  {
    id: 2,
    title: 'Transcription',
    subtitle: 'Conversion de la parole en texte',
    icon: 'document-text',
    duration: 4000,
  },
  {
    id: 3,
    title: 'Génération du résumé',
    subtitle: 'Analyse et synthèse du contenu',
    icon: 'bulb',
    duration: 3000,
  },
  {
    id: 4,
    title: 'Création des flashcards',
    subtitle: 'Identification des concepts clés',
    icon: 'albums',
    duration: 2500,
  },
  {
    id: 5,
    title: 'Génération du quiz',
    subtitle: 'Création de questions personnalisées',
    icon: 'help-circle',
    duration: 2000,
  },
  {
    id: 6,
    title: 'Finalisation',
    subtitle: 'Organisation et sauvegarde du contenu',
    icon: 'checkmark-circle',
    duration: 1500,
  },
];

export const ProcessingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId, subjectId, audioUrl, documentText, localUri, fileName, mimeType } = route.params as RouteParams;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [stepName, setStepName] = useState('Initialisation');
  const [stepDescription, setStepDescription] = useState('Démarrage du traitement');
  const [totalSteps, setTotalSteps] = useState(6);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));
  const [error, setError] = useState<string | null>(null);
  
  const updateProgress = (step: number, total: number, name: string, description: string) => {
    setCurrentStep(step);
    setTotalSteps(total);
    setStepName(name);
    setStepDescription(description);
    Animated.timing(progressAnim, {
      toValue: step / total,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const processContent = async () => {
      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      try {
        // Get lesson and subject info
        const lesson = await DataService.getLesson(lessonId);
        if (!lesson) {
          throw new Error('Impossible de charger les informations de la leçon');
        }
        const subjects = await DataService.getUserSubjects(user.uid);
        const subject = subjects.find(s => s.id === (subjectId || lesson.subjectId));
        
        if (!subject) {
          throw new Error('Impossible de charger les informations de la matière');
        }

        // Define steps dynamically based on whether we have audio to transcribe
        const stepsCount = (localUri || audioUrl) && !documentText ? 6 : 5;
        setTotalSteps(stepsCount);

        // Step 1: Initialisation
        updateProgress(1, stepsCount, 'Initialisation', 'Préparation du traitement');

        // Step 2: Transcription si audio fourni sans texte
        let transcriptionText = documentText || '';
        if ((localUri || audioUrl) && !documentText) {
          updateProgress(2, stepsCount, 'Transcription', 'Conversion de l\'audio en texte');
          transcriptionText = await AIService.transcribeAudio(localUri || (audioUrl as string), fileName, mimeType);
        }

        // Step 3: Génération du cours
        updateProgress((localUri || audioUrl) && !documentText ? 3 : 2, stepsCount, 'Génération du cours', 'Création du contenu structuré');
        const course = await AIService.generateCourse(
          transcriptionText,
          lesson.name,
          lesson.name,
          subject.name
        );

        // Step 4: Création des flashcards
        updateProgress((localUri || audioUrl) && !documentText ? 4 : 3, stepsCount, 'Création des flashcards', 'Extraction des concepts clés');
        const flashcards = await AIService.generateFlashcards(transcriptionText, 20);

        // Step 5: Génération du quiz
        updateProgress((localUri || audioUrl) && !documentText ? 5 : 4, stepsCount, 'Génération du quiz', 'Création des questions d\'évaluation');
        const quiz = await AIService.generateQuiz(transcriptionText, 10);

        // Step 6: Finalisation
        updateProgress(stepsCount, stepsCount, 'Finalisation', 'Sauvegarde du contenu');

        // Persist results in Firebase
        await DataService.updateLesson(lessonId, {
          transcription: transcriptionText,
          summary: course.summary,
          keyPoints: course.key_points,
          flashcards,
          quiz,
          status: 'completed',
          isCompleted: true,
        });

        setIsCompleted(true);
        
      } catch (error) {
        console.error('Processing error:', error);
        // @ts-ignore - runtime error type
        setError((error && error.message) ? error.message : 'Erreur lors du traitement');
        Alert.alert(
          'Erreur de traitement',
          // @ts-ignore - runtime error type
          (error && error.message) ? error.message : 'Une erreur est survenue lors du traitement du contenu.',
          [
            { text: 'Réessayer', onPress: () => processContent() },
            { text: 'Annuler', onPress: () => navigation.goBack(), style: 'cancel' }
          ]
        );
      }
    };

    processContent();
  }, [audioUrl, documentText, lessonId, user]);

  const handleComplete = () => {
    (navigation as any).navigate('Lesson', { lessonId });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleCancel}
          style={styles.cancelButton}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Traitement en cours</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Animation centrale */}
        <View style={styles.animationContainer}>
          <View style={styles.circularProgress}>
            <Animated.View 
              style={[
                styles.progressCircle,
                {
                  transform: [{
                    rotate: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]} 
            />
            <View style={styles.centerIcon}>
              <Ionicons 
                name={isCompleted ? "checkmark" : "cog" as any} 
                size={32} 
                color={isCompleted ? Colors.accent.green : Colors.accent.blue} 
              />
            </View>
          </View>
          
          <Text style={styles.mainTitle}>
            {isCompleted ? 'Traitement terminé !' : stepName}
          </Text>
          <Text style={styles.mainSubtitle}>
            {isCompleted 
              ? 'Votre chapitre est prêt avec tous les contenus générés'
              : stepDescription
            }
          </Text>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {isCompleted ? 'Terminé' : `${currentStep} / ${totalSteps}`}
          </Text>
        </View>

        {/* Étape actuelle */}
        <View style={styles.currentStepCard}>
          <View style={styles.currentStepIcon}>
            <Ionicons 
              name={isCompleted ? "checkmark-circle" : "time"} 
              size={24} 
              color={isCompleted ? Colors.accent.green : Colors.accent.blue} 
            />
          </View>
          <View style={styles.currentStepContent}>
            <Text style={styles.currentStepTitle}>{stepName}</Text>
            <Text style={styles.currentStepDescription}>{stepDescription}</Text>
          </View>
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.infoText}>
              Temps estimé : {isCompleted ? 'Terminé' : '30 secondes restantes'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.infoText}>
              Traitement par IA sécurisé
            </Text>
          </View>
        </View>
        
        {/* Error message */}
        {error && (
          <View style={[styles.infoCard, { backgroundColor: Colors.accent.red + '20' }]}>
            <Ionicons name="alert-circle" size={20} color={Colors.accent.red} />
            <Text style={[styles.infoText, { color: Colors.accent.red }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Bouton d'action */}
        {isCompleted && (
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>Voir le chapitre</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.surface} />
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
  cancelButton: {
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
  content: {
    flex: 1,
    padding: 24,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  circularProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.accent.blue,
    borderTopColor: 'transparent',
  },
  centerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  mainSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 40,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  currentStepCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentStepContent: {
    flex: 1,
  },
  currentStepTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  currentStepDescription: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  infoSection: {
    gap: 12,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    flex: 1,
  },
  completeButton: {
    backgroundColor: Colors.accent.green,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
});


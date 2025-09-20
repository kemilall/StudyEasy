import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { fetchChapter } from '../api/backend';
import { Chapter } from '../types';

const PROCESSING_STEPS = [
  {
    id: 1,
    title: 'Analyse de l\'entrée',
    subtitle: 'Préparation du contenu à traiter',
    icon: 'waveform',
  },
  {
    id: 2,
    title: 'Transcription',
    subtitle: 'Conversion du contenu en texte exploitable',
    icon: 'document-text',
  },
  {
    id: 3,
    title: 'Synthèse du cours',
    subtitle: 'Structure et rédaction du chapitre',
    icon: 'bulb',
  },
  {
    id: 4,
    title: 'Flashcards et Quiz',
    subtitle: 'Extraction des notions clés',
    icon: 'albums',
  },
  {
    id: 5,
    title: 'Finalisation',
    subtitle: 'Organisation et sauvegarde du contenu',
    icon: 'checkmark-circle',
  },
];

type ProcessingRouteProp = RouteProp<{ params: { chapterId: string } }, 'params'>;

const POLL_INTERVAL = 5000;

export const ProcessingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ProcessingRouteProp>();
  const { chapterId } = route.params;

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));
  const [chapter, setChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const pollStatus = async () => {
      try {
        const data = await fetchChapter(chapterId);
        if (!isMounted) return;
        setChapter(data);
        if (data.status === 'completed') {
          setIsCompleted(true);
          setIsFailed(false);
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }).start();
          setCurrentStep(PROCESSING_STEPS.length - 1);
          if (timer) clearInterval(timer);
          setTimeout(() => {
            navigation.navigate('Chapter', { chapterId });
          }, 1200);
        } else if (data.status === 'failed') {
          setIsFailed(true);
          if (timer) clearInterval(timer);
        } else {
          setIsFailed(false);
          Animated.timing(progressAnim, {
            toValue: 0.2 + Math.random() * 0.6,
            duration: 800,
            useNativeDriver: false,
          }).start();
          setCurrentStep((prev) => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
        }
      } catch (error) {
        // Ignorer l'erreur ponctuelle, réessaie au prochain tick
      }
    };

    pollStatus();
    timer = setInterval(pollStatus, POLL_INTERVAL);

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [chapterId, navigation, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const displaySubtitle = useMemo(() => {
    if (isFailed) {
      return 'La génération a échoué. Retournez au chapitre et réessayez.';
    }
    if (isCompleted) {
      return 'Votre chapitre est prêt avec tous les contenus générés.';
    }
    return PROCESSING_STEPS[currentStep]?.subtitle ?? '';
  }, [currentStep, isCompleted, isFailed]);

  const displayTitle = useMemo(() => {
    if (isFailed) return 'Une erreur est survenue';
    if (isCompleted) return 'Traitement terminé !';
    return PROCESSING_STEPS[currentStep]?.title ?? 'Traitement en cours';
  }, [currentStep, isCompleted, isFailed]);

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
              {isFailed ? (
                <Ionicons name="warning" size={32} color={Colors.accent.red} />
              ) : isCompleted ? (
                <Ionicons name="checkmark" size={32} color={Colors.accent.green} />
              ) : (
                <Ionicons 
                  name={PROCESSING_STEPS[currentStep]?.icon as any} 
                  size={32} 
                  color={Colors.accent.blue} 
                />
              )}
            </View>
          </View>
          
          <Text style={styles.mainTitle}>
            {displayTitle}
          </Text>
          <Text style={styles.mainSubtitle}>
            {displaySubtitle}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {isCompleted ? 'Terminé' : `${currentStep + 1} / ${PROCESSING_STEPS.length}`}
          </Text>
        </View>

        <View style={styles.stepsList}>
          {PROCESSING_STEPS.map((step, index) => {
            const isActive = index === currentStep && !isCompleted && !isFailed;
            const completed = index < currentStep || isCompleted;
            
            return (
              <View key={step.id} style={styles.stepItem}>
                <View style={[
                  styles.stepIcon,
                  isActive && styles.stepIconActive,
                  completed && styles.stepIconCompleted,
                ]}>
                  {completed ? (
                    <Ionicons name="checkmark" size={16} color={Colors.accent.green} />
                  ) : isFailed && index === currentStep ? (
                    <Ionicons name="warning" size={16} color={Colors.accent.red} />
                  ) : (
                    <Ionicons 
                      name={step.icon as any}
                      size={16}
                      color={
                        isActive ? Colors.accent.blue : Colors.text.tertiary
                      }
                    />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    isActive && styles.stepTitleActive,
                    completed && styles.stepTitleCompleted,
                    isFailed && index === currentStep && styles.stepTitleFailed,
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {chapter?.failureReason && isFailed && (
          <View style={styles.errorDetails}>
            <Ionicons name="alert-circle" size={20} color={Colors.accent.red} />
            <Text style={styles.errorDetailsText}>{chapter.failureReason}</Text>
          </View>
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
    gap: 24,
  },
  animationContainer: {
    alignItems: 'center',
    gap: 16,
  },
  circularProgress: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  progressCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: Colors.accent.blue + '30',
    borderStyle: 'dashed',
  },
  centerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  mainTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  mainSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  progressSection: {
    gap: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.blue,
  },
  progressText: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconActive: {
    backgroundColor: Colors.accent.blue + '15',
  },
  stepIconCompleted: {
    backgroundColor: Colors.accent.green + '15',
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  stepTitleActive: {
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  stepTitleCompleted: {
    color: Colors.accent.green,
  },
  stepTitleFailed: {
    color: Colors.accent.red,
  },
  stepSubtitle: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
  },
  errorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent.red + '10',
    padding: 12,
    borderRadius: 12,
  },
  errorDetailsText: {
    ...Typography.footnote,
    color: Colors.accent.red,
    flex: 1,
  },
});

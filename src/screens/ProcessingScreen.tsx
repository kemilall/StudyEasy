import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const PROCESSING_STEPS = [
  {
    id: 1,
    title: 'Analyse de l\'audio',
    subtitle: 'Extraction et optimisation du signal audio',
    icon: 'waveform',
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const processSteps = async () => {
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setCurrentStep(i);
        
        // Animer la barre de progression
        Animated.timing(progressAnim, {
          toValue: (i + 1) / PROCESSING_STEPS.length,
          duration: PROCESSING_STEPS[i].duration,
          useNativeDriver: false,
        }).start();

        // Attendre la durée de l'étape
        await new Promise(resolve => setTimeout(resolve, PROCESSING_STEPS[i].duration));
      }
      
      setIsCompleted(true);
    };

    processSteps();
  }, []);

  const handleComplete = () => {
    navigation.navigate('Chapter' as never, { chapterId: '1' } as never);
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
                name={isCompleted ? "checkmark" : PROCESSING_STEPS[currentStep]?.icon as any} 
                size={32} 
                color={isCompleted ? Colors.accent.green : Colors.accent.blue} 
              />
            </View>
          </View>
          
          <Text style={styles.mainTitle}>
            {isCompleted ? 'Traitement terminé !' : PROCESSING_STEPS[currentStep]?.title}
          </Text>
          <Text style={styles.mainSubtitle}>
            {isCompleted 
              ? 'Votre chapitre est prêt avec tous les contenus générés'
              : PROCESSING_STEPS[currentStep]?.subtitle
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
            {isCompleted ? 'Terminé' : `${currentStep + 1} / ${PROCESSING_STEPS.length}`}
          </Text>
        </View>

        {/* Liste des étapes */}
        <View style={styles.stepsList}>
          {PROCESSING_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || isCompleted;
            
            return (
              <View key={step.id} style={styles.stepItem}>
                <View style={[
                  styles.stepIcon,
                  isActive && styles.stepIconActive,
                  isCompleted && styles.stepIconCompleted,
                ]}>
                  <Ionicons 
                    name={isCompleted ? "checkmark" : step.icon as any}
                    size={16} 
                    color={
                      isCompleted ? Colors.accent.green :
                      isActive ? Colors.accent.blue : 
                      Colors.text.tertiary
                    } 
                  />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    isActive && styles.stepTitleActive,
                    isCompleted && styles.stepTitleCompleted,
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.infoText}>
              Temps estimé : {isCompleted ? 'Terminé' : '2-3 minutes restantes'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.infoText}>
              Vos données sont traitées en sécurité
            </Text>
          </View>
        </View>

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
  stepsList: {
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIconActive: {
    backgroundColor: Colors.accent.blue + '20',
  },
  stepIconCompleted: {
    backgroundColor: Colors.accent.green + '20',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.subheadline,
    color: Colors.text.tertiary,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepTitleActive: {
    color: Colors.accent.blue,
  },
  stepTitleCompleted: {
    color: Colors.accent.green,
  },
  stepSubtitle: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
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


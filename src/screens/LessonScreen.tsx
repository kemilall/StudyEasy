import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Lesson, StructuredCourse } from '../types';
import { StructuredCourseView } from '../components/StructuredCourseView';

const BackgroundWavesImage = require('../../assets/background_waves.png');

const BrainLogoSvg = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="68.0478 80.168 363.9044 339.6639" width="363.904px" height="339.664px" preserveAspectRatio="none"><defs><linearGradient id="gradient_0" gradientUnits="userSpaceOnUse" x1="581.20789" y1="481.94135" x2="413.09717" y2="239.49858" gradientTransform="matrix(1, 0, 0, 1, -260.599213, -134.646912)"><stop offset="0" stop-color="#B0C1FF"/><stop offset="1" stop-color="#CFC5FF"/></linearGradient></defs><g transform="matrix(1, 0, 0, 1, 4.847660064697266, -0.5631560683249859)" id="object-0"><path fill="url(#gradient_0)" d="M 235.311 81.063 C 237.676 80.793 242.221 80.763 244.756 80.733 C 295.886 80.513 345.069 100.333 381.757 135.943 C 418.046 171.752 448.624 243.468 407.258 287.548 C 396.851 298.638 381.07 303.78 366.346 305.923 C 322.65 312.282 284.188 290.958 246.258 273.029 C 225.308 263.048 204.995 255.564 181.425 256.368 C 159.452 257.117 147.297 264.696 130.517 277.684 C 119.426 286.27 103.274 302.427 88.641 301.861 C 65.838 300.98 62.284 268.823 63.373 251.696 C 63.648 247.412 64.12 236.827 67.69 233.799 C 68.343 233.246 78.603 232.388 80.501 232.109 C 83.528 231.642 86.509 230.916 89.411 229.939 C 106.209 224.37 129.731 202.902 142.624 191.103 C 181.94 155.244 230.71 157.881 274.48 184.641 C 298.767 199.49 323.714 220.904 354.425 213.137 C 365.149 210.426 372.214 204.125 377.568 194.771 C 361.084 202.03 349.771 201.403 332.949 195.329 C 309.894 187.004 294.955 168.992 274.075 157.259 C 255.913 146.947 235.281 141.787 214.403 142.334 C 176.238 143.185 148.179 163.174 121.963 188.277 C 112.409 197.425 99.749 208.081 86.97 211.412 C 83.804 212.237 74.292 214.114 71.226 212.171 C 70.488 211.736 69.648 209.801 69.778 208.941 C 73.086 187.201 92.097 158.497 105.996 142.88 C 140.264 104.376 184.563 84.583 235.311 81.063 Z" style="stroke-width: 1;"/><path fill="#B5C2FE" d="M 182.875 280.559 C 220.846 276.161 249.755 300.45 284.248 309.81 C 290.845 311.6 302.498 311.315 309.494 311.374 C 300.981 321.295 284.729 325.611 272.697 332.078 C 246.162 346.34 228.641 368.591 212.973 393.644 C 209.338 399.192 206.431 405.258 202.982 410.921 C 195.127 423.818 184.289 422.47 174.193 413.337 C 176.137 403.166 182.51 393.721 180.389 381.653 C 179.871 378.707 178.247 373.688 176.002 371.771 C 162.087 360.223 141.951 364.154 127.452 352.948 C 112.235 341.187 118.903 320.364 129.367 307.864 C 143.315 291.201 161.358 282.656 182.875 280.559 Z" style="stroke-width: 1;"/></g></svg>`;

export const LessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { lessonId } = route.params as { lessonId: string };

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [structuredCourse, setStructuredCourse] = useState<StructuredCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !lessonId) return;

    const loadLesson = async () => {
      try {
        const lessonData = await DataService.getLesson(lessonId);

        if (lessonData) {
          // Fetch subject information to enrich the lesson
          try {
            const subjects = await DataService.getUserSubjects(user.uid);
            const subject = subjects.find(s => s.id === lessonData.subjectId);
            
            if (subject) {
              lessonData.subjectName = subject.name;
              lessonData.subjectColor = subject.color;
            }
          } catch (subjectError) {
            console.error('Error fetching subject info:', subjectError);
          }

          // Try to get structured course from lesson data
          if (lessonData.course) {
            // Course data already parsed
            setStructuredCourse(lessonData.course as StructuredCourse);
          } else if (lessonData.content) {
            // Try to parse from content field for backward compatibility
            try {
              const parsedCourse = JSON.parse(lessonData.content);
              // Check for new structure (French field names)
              if (parsedCourse.titre_cours && parsedCourse.sections) {
                setStructuredCourse(parsedCourse as StructuredCourse);
              }
              // Check for old structure
              else if (parsedCourse.overview && parsedCourse.sections) {
                setStructuredCourse(parsedCourse as StructuredCourse);
              }
            } catch (parseError) {
              console.log('Could not parse structured course from content');
            }
          }

          setLesson(lessonData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading lesson:', error);
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [user, lessonId]);

  const markAsCompleted = async () => {
    if (!lesson) return;

    try {
      await DataService.updateLesson(lessonId, { isCompleted: true });
      setLesson({ ...lesson, isCompleted: true });
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this lesson: ${lesson?.name || 'StudyEasy Lesson'}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.accent.red} />
          <Text style={styles.errorTitle}>Leçon non trouvée</Text>
          <Text style={styles.errorSubtitle}>Cette leçon n'existe pas ou a été supprimée</Text>
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
    <View style={styles.mainWrapper}>
      {/* Background decorative waves */}
      <ImageBackground
        source={BackgroundWavesImage}
        style={styles.backgroundWaves}
        resizeMode="cover"
        imageStyle={{
          opacity: 0.15,
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <SvgXml xml={BrainLogoSvg} width={32} height={32} />
          </View>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerShareButton}
          >
            <Ionicons name="share-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

      {lesson.status === 'draft' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.accent.blue} />
            <Text style={styles.processingTitle}>Traitement en cours...</Text>
            <Text style={styles.processingSubtitle}>
              Votre contenu est en cours de traitement par l'IA. Cela peut prendre quelques minutes.
            </Text>
          </View>
        </ScrollView>
      ) : structuredCourse ? (
        <StructuredCourseView 
          course={structuredCourse}
          lesson={lesson}
          onMarkComplete={markAsCompleted}
          onNavigate={(screen, params) => navigation.navigate(screen as never, params as never)}
        />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Card */}
          <View style={[styles.statusCard, lesson.isCompleted && styles.completedCard]}>
            <View style={styles.statusIcon}>
              <Ionicons
                name={lesson.isCompleted ? "checkmark-circle" : "time-outline"}
                size={24}
                color={lesson.isCompleted ? Colors.accent.green : Colors.accent.orange}
              />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {lesson.isCompleted ? 'Leçon terminée' : 'En cours'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {lesson.duration > 0 ? `${lesson.duration} minutes` : 'Durée inconnue'}
              </Text>
            </View>
            {!lesson.isCompleted && (
              <TouchableOpacity style={styles.completeButton} onPress={markAsCompleted}>
                <Text style={styles.completeButtonText}>Terminer</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Summary */}
          {lesson.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Résumé</Text>
              <View style={styles.card}>
                <Text style={styles.summaryText}>{lesson.summary}</Text>
              </View>
            </View>
          )}

          {/* Key Points */}
          {lesson.keyPoints && lesson.keyPoints.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Points clés</Text>
              <View style={styles.card}>
                {lesson.keyPoints.map((point, index) => (
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
            {lesson.transcription && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Transcription' as never, { lessonId })}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.accent.purple + '15' }]}>
                  <Ionicons name="document-text" size={24} color={Colors.accent.purple} />
                </View>
                <Text style={styles.actionTitle}>Transcription</Text>
                <Text style={styles.actionSubtitle}>Texte complet</Text>
              </TouchableOpacity>
            )}

            {lesson.flashcards && lesson.flashcards.length > 0 && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Flashcards' as never, { lessonId })}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.accent.blue + '15' }]}>
                  <Ionicons name="albums" size={24} color={Colors.accent.blue} />
                </View>
                <Text style={styles.actionTitle}>Flashcards</Text>
                <Text style={styles.actionSubtitle}>{lesson.flashcards.length} cartes</Text>
              </TouchableOpacity>
            )}

            {lesson.quiz && lesson.quiz.length > 0 && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Quiz' as never, { lessonId })}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.accent.green + '15' }]}>
                  <Ionicons name="help-circle" size={24} color={Colors.accent.green} />
                </View>
                <Text style={styles.actionTitle}>Quiz</Text>
                <Text style={styles.actionSubtitle}>{lesson.quiz.length} questions</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Chat' as never, { lessonId })}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.accent.orange + '15' }]}>
                <Ionicons name="chatbubble" size={24} color={Colors.accent.orange} />
              </View>
              <Text style={styles.actionTitle}>Chat IA</Text>
              <Text style={styles.actionSubtitle}>Posez vos questions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  backgroundWaves: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerShareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  courseContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 0,
    maxHeight: 600, // Limit height to prevent excessive scrolling
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
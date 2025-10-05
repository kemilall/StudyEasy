import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Subject, Lesson } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';

// Import new components
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { QuickActionsSection } from '../components/QuickActionsSection';
import { SubjectsCarousel } from '../components/SubjectsCarousel';
import { CoursesListSection } from '../components/CoursesListSection';

const BackgroundWavesImage = require('../../assets/background_waves.png');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, userProfile } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;

    setIsLoadingSubjects(true);
    setIsLoadingLessons(true);

    // Subscribe to real-time updates for user subjects
    const unsubscribeSubjects = DataService.subscribeToUserSubjects(user.uid, (updatedSubjects) => {
      setSubjects(updatedSubjects);
      setIsLoadingSubjects(false);
    });

    // Subscribe to real-time updates for recent lessons
    const unsubscribeLessons = DataService.subscribeToRecentLessons(user.uid, (updatedLessons) => {
      setRecentLessons(updatedLessons);
      setIsLoadingLessons(false);
    }, 10); // Limit to 10 recent lessons

    return () => {
      unsubscribeSubjects();
      unsubscribeLessons();
    };
  }, [user?.uid]);

  // Use real data only
  const displaySubjects = subjects;
  const displayLessons = recentLessons;

  // Event handlers for analytics
  const handleRecordPress = () => {
    // Analytics event would go here
    navigation.navigate('RecordingSubjectPicker' as never);
  };

  const handleImportAudioPress = () => {
    // Analytics event would go here
    if (subjects.length === 0) {
      // No subjects, redirect to create subject
      navigation.navigate('CreateSubject' as never);
    } else if (subjects.length === 1) {
      // Only one subject, use it directly
      navigation.navigate('AudioImport' as never, {
        subjectId: subjects[0].id,
      });
    } else {
      // Multiple subjects, let user choose (for now, use first one)
      // TODO: Create a subject picker screen for import
      navigation.navigate('AudioImport' as never, {
        subjectId: subjects[0].id,
      });
    }
  };

  const handleImportCoursePress = () => {
    // Analytics event would go here
    navigation.navigate('CreateLesson' as never);
  };

  const handleCourseOpen = (course: Lesson) => {
    // Analytics event would go here
    navigation.navigate('Lesson', { lessonId: course.id });
  };

  const handleCourseReview = (course: Lesson) => {
    // Analytics event would go here
    // Navigate to review or show modal
  };

  const handleCourseQuiz = (course: Lesson) => {
    // Analytics event would go here
    navigation.navigate('Quiz', { lessonId: course.id });
  };

  return (
    <View style={{
    flex: 1,
    backgroundColor: Colors.surface,
    }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background decorative waves - Fixed */}
      <ImageBackground
        source={BackgroundWavesImage}
        style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
        imageStyle={{
          opacity: 0.15,
        }}
      />

      <SafeAreaView style={{
        flex: 1,
      }}>

      {/* Header */}
      <Header />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            flexGrow: 1,
          }}
        >
          {/* Hero Section */}
          <HeroSection firstName={userProfile?.displayName?.split(' ')[0]} />

          {/* Quick Actions */}
        <QuickActionsSection
          onRecordPress={handleRecordPress}
          onImportAudioPress={handleImportAudioPress}
          onImportCoursePress={handleImportCoursePress}
          subjects={subjects}
        />

          {/* Recent Subjects */}
          <SubjectsCarousel subjects={displaySubjects} />

          {/* Latest Courses */}
          <CoursesListSection
            courses={displayLessons}
            isLoading={isLoadingLessons}
            onCourseOpen={handleCourseOpen}
            onCourseReview={handleCourseReview}
            onCourseQuiz={handleCourseQuiz}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { ChapterCard } from '../components/ChapterCard';
import { mockLessons, mockChapters } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import * as DocumentPicker from 'expo-document-picker';

type LessonScreenRouteProp = RouteProp<RootStackParamList, 'Lesson'>;
type LessonScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Lesson'>;

export const LessonScreen: React.FC = () => {
  const navigation = useNavigation<LessonScreenNavigationProp>();
  const route = useRoute<LessonScreenRouteProp>();
  const { lessonId } = route.params;

  const lesson = mockLessons.find(l => l.id === lessonId);
  const chapters = mockChapters.filter(c => c.lessonId === lessonId);

  if (!lesson) {
    return null;
  }

  const handleUploadAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        Alert.alert(
          'Audio importé',
          'Le fichier audio est en cours de traitement. Vous serez notifié une fois terminé.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'importer le fichier audio.');
    }
  };

  const renderChapter = ({ item }: { item: typeof chapters[0] }) => (
    <ChapterCard
      chapter={item}
      onPress={() => navigation.navigate('Chapter', { chapterId: item.id })}
      onUpload={handleUploadAudio}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{lesson.name}</Text>
          <Text style={styles.subtitle}>
            {lesson.completedChapters}/{lesson.chaptersCount} chapitres complétés
          </Text>
        </View>
      </View>

      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
});

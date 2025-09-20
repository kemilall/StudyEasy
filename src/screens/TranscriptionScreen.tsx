import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { Chapter } from '../types';
import { fetchChapter } from '../api/backend';

type TranscriptionScreenRouteProp = RouteProp<RootStackParamList, 'Transcription'>;
type TranscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Transcription'>;

export const TranscriptionScreen: React.FC = () => {
  const navigation = useNavigation<TranscriptionScreenNavigationProp>();
  const route = useRoute<TranscriptionScreenRouteProp>();
  const { chapterId } = route.params;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadChapter = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await fetchChapter(chapterId);
      setChapter(data);
    } catch (_err) {
      setError("Impossible de charger la transcription.");
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  if (isLoading && !chapter) {
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
        <TouchableOpacity style={styles.retryButton} onPress={loadChapter}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!chapter || !chapter.transcript) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="document-outline" size={32} color={Colors.text.tertiary} />
        <Text style={styles.emptyText}>Aucune transcription disponible pour le moment.</Text>
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
        
        <Text style={styles.title}>Transcription</Text>
        
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadChapter} />}
      >
        <Text style={styles.chapterName}>{chapter.name}</Text>
        <Text style={styles.text}>{chapter.transcript}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  chapterName: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginBottom: 24,
  },
  text: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 26,
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

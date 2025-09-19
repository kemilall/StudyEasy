import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { mockChapters } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';

type TranscriptionScreenRouteProp = RouteProp<RootStackParamList, 'Transcription'>;
type TranscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Transcription'>;

export const TranscriptionScreen: React.FC = () => {
  const navigation = useNavigation<TranscriptionScreenNavigationProp>();
  const route = useRoute<TranscriptionScreenRouteProp>();
  const { chapterId } = route.params;

  const chapter = mockChapters.find(c => c.id === chapterId);

  if (!chapter || !chapter.transcription) {
    return null;
  }

  // Mock transcription with timestamps
  const transcriptionParagraphs = [
    {
      time: '00:00',
      text: 'Bonjour et bienvenue dans ce cours sur les matrices. Aujourd\'hui, nous allons explorer les concepts fondamentaux qui constituent la base de l\'algèbre linéaire.',
    },
    {
      time: '00:45',
      text: 'Une matrice est essentiellement un tableau rectangulaire de nombres, arrangés en lignes et colonnes. Cette structure simple cache une puissance remarquable pour résoudre des problèmes complexes.',
    },
    {
      time: '01:30',
      text: 'Commençons par la notation. Une matrice est généralement notée par une lettre majuscule, comme A, B ou C. Les éléments individuels sont notés avec des indices.',
    },
    {
      time: '02:15',
      text: 'Par exemple, dans une matrice A, l\'élément situé à la ligne i et colonne j est noté a_ij. Cette notation nous permet de référencer précisément chaque élément.',
    },
    {
      time: '03:00',
      text: 'Les opérations de base sur les matrices incluent l\'addition et la soustraction. Pour additionner deux matrices, elles doivent avoir les mêmes dimensions.',
    },
    {
      time: '03:45',
      text: 'La multiplication matricielle est plus complexe. Le produit AB n\'est défini que si le nombre de colonnes de A égale le nombre de lignes de B.',
    },
  ];

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
      >
        <Text style={styles.chapterName}>{chapter.name}</Text>
        
        {transcriptionParagraphs.map((paragraph, index) => (
          <View key={index} style={styles.paragraph}>
            <Text style={styles.timestamp}>{paragraph.time}</Text>
            <Text style={styles.text}>{paragraph.text}</Text>
          </View>
        ))}
      </ScrollView>
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
  paragraph: {
    marginBottom: 24,
  },
  timestamp: {
    ...Typography.caption1,
    color: Colors.accent.blue,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
  },
});

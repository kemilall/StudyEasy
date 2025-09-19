import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { mockFlashcards } from '../data/mockData';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';

type FlashcardsScreenRouteProp = RouteProp<RootStackParamList, 'Flashcards'>;
type FlashcardsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Flashcards'>;

const { width } = Dimensions.get('window');

export const FlashcardsScreen: React.FC = () => {
  const navigation = useNavigation<FlashcardsScreenNavigationProp>();
  const route = useRoute<FlashcardsScreenRouteProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const flashcards = mockFlashcards;
  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
    }
  };

  const handleReveal = () => {
    setIsRevealed(!isRevealed);
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
        
        <Text style={styles.title}>Flashcards</Text>
        
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {flashcards.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / flashcards.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView 
        style={styles.cardContainer}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={handleReveal}
          activeOpacity={0.9}
        >
          <View style={styles.cardInner}>
            <Text style={styles.cardLabel}>
              {isRevealed ? 'Réponse' : 'Question'}
            </Text>
            <Text style={styles.cardText}>
              {isRevealed ? currentCard.answer : currentCard.question}
            </Text>
          </View>
          
          <View style={styles.tapHint}>
            <Ionicons 
              name="hand-left-outline" 
              size={20} 
              color={Colors.text.tertiary} 
            />
            <Text style={styles.tapHintText}>
              Toucher pour {isRevealed ? 'voir la question' : 'révéler'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            currentIndex === 0 && styles.controlButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentIndex === 0 ? Colors.text.tertiary : Colors.text.primary} 
          />
          <Text style={[
            styles.controlText,
            currentIndex === 0 && styles.controlTextDisabled
          ]}>
            Précédent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            currentIndex === flashcards.length - 1 && styles.controlButtonDisabled
          ]}
          onPress={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <Text style={[
            styles.controlText,
            currentIndex === flashcards.length - 1 && styles.controlTextDisabled
          ]}>
            Suivant
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={currentIndex === flashcards.length - 1 ? Colors.text.tertiary : Colors.text.primary} 
          />
        </TouchableOpacity>
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
  placeholder: {
    width: 40,
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
    textAlign: 'center',
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
  cardContainer: {
    flex: 1,
  },
  cardContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  cardText: {
    ...Typography.title2,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 24,
  },
  tapHintText: {
    ...Typography.caption1,
    color: Colors.text.tertiary,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.gray[100],
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  controlTextDisabled: {
    color: Colors.text.tertiary,
  },
});

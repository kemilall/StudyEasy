import { Subject, Lesson, Chapter, Flashcard, QuizQuestion } from '../types';

export const mockSubjects: Subject[] = [
  {
    id: '1',
    name: 'Mathématiques',
    color: '#007AFF',
    lessonsCount: 3,
    completedLessons: 1,
  },
  {
    id: '2',
    name: 'Physique',
    color: '#34C759',
    lessonsCount: 2,
    completedLessons: 0,
  },
  {
    id: '3',
    name: 'Chimie',
    color: '#FF9500',
    lessonsCount: 4,
    completedLessons: 2,
  },
  {
    id: '4',
    name: 'Biologie',
    color: '#5856D6',
    lessonsCount: 3,
    completedLessons: 1,
  },
];

export const mockLessons: Lesson[] = [
  {
    id: '1',
    subjectId: '1',
    name: 'Algèbre Linéaire',
    chaptersCount: 4,
    completedChapters: 2,
    duration: 180,
  },
  {
    id: '2',
    subjectId: '1',
    name: 'Calcul Différentiel',
    chaptersCount: 3,
    completedChapters: 0,
    duration: 240,
  },
  {
    id: '3',
    subjectId: '1',
    name: 'Statistiques',
    chaptersCount: 5,
    completedChapters: 5,
    duration: 300,
  },
];

export const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    question: 'Qu\'est-ce qu\'une matrice identité ?',
    answer: 'Une matrice carrée avec des 1 sur la diagonale principale et des 0 partout ailleurs. Elle est l\'élément neutre de la multiplication matricielle.',
  },
  {
    id: '2',
    question: 'Comment calculer le déterminant d\'une matrice 2x2 ?',
    answer: 'Pour une matrice [[a,b],[c,d]], le déterminant est ad - bc.',
  },
  {
    id: '3',
    question: 'Quelle est la condition pour qu\'une matrice soit inversible ?',
    answer: 'Une matrice est inversible si et seulement si son déterminant est non nul.',
  },
  {
    id: '4',
    question: 'Qu\'est-ce qu\'une valeur propre ?',
    answer: 'Une valeur λ telle qu\'il existe un vecteur non nul v satisfaisant Av = λv, où A est la matrice.',
  },
];

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'Quelle est la dimension d\'une matrice avec 3 lignes et 4 colonnes ?',
    options: ['3x3', '4x3', '3x4', '4x4'],
    correctAnswer: 2,
    explanation: 'Une matrice est notée m×n où m est le nombre de lignes et n le nombre de colonnes.',
  },
  {
    id: '2',
    question: 'Le produit de deux matrices est commutatif.',
    options: ['Vrai', 'Faux'],
    correctAnswer: 1,
    explanation: 'La multiplication matricielle n\'est généralement pas commutative : AB ≠ BA dans la plupart des cas.',
  },
  {
    id: '3',
    question: 'Quel est le déterminant de la matrice identité 3x3 ?',
    options: ['0', '1', '3', '9'],
    correctAnswer: 1,
    explanation: 'Le déterminant de toute matrice identité est toujours égal à 1.',
  },
];

export const mockChapters: Chapter[] = [
  {
    id: '1',
    lessonId: '1',
    name: 'Introduction aux Matrices',
    summary: 'Ce chapitre explore les concepts fondamentaux des matrices, incluant les opérations de base, la multiplication matricielle et les applications pratiques en algèbre linéaire.',
    bulletPoints: [
      'Définition et notation des matrices',
      'Opérations élémentaires : addition et soustraction',
      'Multiplication matricielle et propriétés',
      'Matrices identité et inverses',
      'Applications en résolution de systèmes linéaires',
    ],
    transcription: 'Transcription complète du cours sur les matrices...',
    flashcards: mockFlashcards,
    quiz: mockQuizQuestions,
    isProcessing: false,
    isCompleted: true,
    duration: 45,
  },
  {
    id: '2',
    lessonId: '1',
    name: 'Déterminants et Valeurs Propres',
    summary: 'Étude approfondie des déterminants et leur utilisation dans le calcul des valeurs propres et vecteurs propres.',
    bulletPoints: [
      'Calcul du déterminant pour matrices 2x2 et 3x3',
      'Propriétés des déterminants',
      'Introduction aux valeurs propres',
      'Méthode de calcul des vecteurs propres',
      'Applications en diagonalisation',
    ],
    flashcards: mockFlashcards,
    quiz: mockQuizQuestions,
    isProcessing: false,
    isCompleted: true,
    duration: 60,
  },
  {
    id: '3',
    lessonId: '1',
    name: 'Espaces Vectoriels',
    isProcessing: true,
    isCompleted: false,
    duration: 0,
  },
];
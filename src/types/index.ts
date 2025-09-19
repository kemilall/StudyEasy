export interface Subject {
  id: string;
  name: string;
  color: string;
  lessonsCount: number;
  completedLessons: number;
}

export interface Lesson {
  id: string;
  subjectId: string;
  name: string;
  chaptersCount: number;
  completedChapters: number;
  duration: number; // in minutes
}

export interface Chapter {
  id: string;
  lessonId: string;
  name: string;
  audioUrl?: string;
  summary?: string;
  bulletPoints?: string[];
  transcription?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  isProcessing: boolean;
  isCompleted: boolean;
  duration: number; // in minutes
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  isRevealed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

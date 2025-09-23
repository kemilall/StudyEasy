// Base types for the StudyEasy app

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lessonsCount?: number;
  completedLessons?: number;
}

export interface Lesson {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  chaptersCount?: number;
  completedChapters?: number;
  duration?: number;
}

export interface Chapter {
  id: string;
  name: string;
  content?: string;
  transcription?: string;
  summary?: string;
  keyPoints?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  lessonId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status?: 'draft' | 'processing' | 'completed';
  progress?: number;
  duration?: number;
  isCompleted?: boolean;
  // Enhanced properties for display
  subjectName?: string;
  subjectColor?: string;
  lessonName?: string;
  subjectId?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  chapterId?: string;
  createdAt?: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  chapterId?: string;
  createdAt?: Date;
}

// API Response types
export interface ProcessedChapterResponse {
  transcription: string;
  course: {
    title: string;
    introduction: string;
    sections: Array<{ heading: string; content: string }>;
    key_points: string[];
    summary: string;
  };
  flashcards: Array<{
    term: string;
    definition: string;
    example?: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }>;
  key_points: string[];
  summary: string;
}

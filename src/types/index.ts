export interface Subject {
  id: string;
  name: string;
  color: string;
  lessonsCount: number;
  completedLessons: number;
  description?: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  name: string;
  chaptersCount: number;
  completedChapters: number;
  duration: number; // in minutes
  description?: string;
}

export interface Chapter {
  id: string;
  lessonId: string;
  name: string;
  description?: string;
  status: ChapterStatus;
  sourceType: ChapterSource;
  summary?: string;
  bulletPoints?: string[];
  sections?: CourseSection[];
  transcript?: string;
  audioRemoteUrl?: string | null;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  isProcessing: boolean;
  isCompleted: boolean;
  duration: number; // in minutes
  failureReason?: string | null;
  created_at?: string;
  completed_at?: string | null;
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

export interface CourseSection {
  heading: string;
  overview: string;
  key_points: string[];
  detailed_content: string;
}

export type ChapterStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ChapterSource = 'text' | 'audio';

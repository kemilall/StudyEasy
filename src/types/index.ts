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
  icon?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lessonsCount?: number;
  completedLessons?: number;
}

export interface Lesson {
  id: string;
  name: string;
  content?: string;
  transcription?: string;
  summary?: string;
  keyPoints?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  subjectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status?: 'draft' | 'processing' | 'completed';
  progress?: number;
  duration?: number;
  audioUrl?: string;
  isCompleted?: boolean;
  // Enhanced properties for display
  subjectName?: string;
  subjectColor?: string;
}

export interface RecordingDraft {
  id: string; // lessonId associated with the recording session
  userId: string;
  subjectId: string;
  subjectName: string;
  subjectColor?: string;
  lessonName: string;
  localFileUri: string;
  durationMillis: number;
  segments: RecordingSegment[];
  updatedAt: number;
  status: 'recording' | 'paused' | 'stopped';
}

export interface RecordingSegment {
  id: string;
  uri: string;
  durationMillis: number;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  lessonId?: string;
  createdAt?: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  lessonId?: string;
  createdAt?: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

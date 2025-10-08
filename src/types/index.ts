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
  isDeleting?: boolean;
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
  course?: StructuredCourse | LegacyStructuredCourse; // New structured course data
  subjectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status?: 'draft' | 'completed';
  progress?: number;
  duration?: number;
  audioUrl?: string;
  isCompleted?: boolean;
  // Enhanced properties for display
  subjectName?: string;
  subjectColor?: string;
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

// New content types for structured courses (French backend format)
export interface ContentItem {
  type: 'texte' | 'formule' | 'mindmap' | 'definition' | 'exemple' | 'sous-section';
  valeur?: string;
  titre?: string;
  contenu?: ContentItem[];
}

export interface CourseSection {
  titre: string;
  contenu: ContentItem[];
}

export interface CourseIntroduction {
  texte: string;
}

export interface CourseConclusion {
  texte: string;
}

export interface CourseReference {
  type?: 'livre' | 'article' | 'video' | 'site';
  titre: string;
  auteur?: string;
  annee?: number;
  editeur?: string;
  lien?: string;
}

export interface StructuredCourse {
  titre_cours: string;
  description: string;
  introduction: CourseIntroduction;
  plan: string[];
  sections: CourseSection[];
  conclusion: CourseConclusion;
  references: CourseReference[];
}

// Legacy content block types (for backward compatibility)
export interface ContentBlock {
  type: 'text' | 'example' | 'formula' | 'definition' | 'bullet_points' | 'summary';
  content: string;
  title?: string;
}

export interface Subsection {
  title: string;
  blocks: ContentBlock[];
}

export interface Section {
  title: string;
  subsections: Subsection[];
}

export interface CourseOverview {
  objective: string;
  main_ideas: string[];
  structure: string[];
}

export interface LegacyStructuredCourse {
  title: string;
  overview: CourseOverview;
  sections: Section[];
  conclusion: string;
  references: string[];
}

// Legacy course structure for backward compatibility
export interface SimpleCourse {
  title: string;
  introduction: string;
  sections: Array<{ heading: string; content: string }>;
  key_points: string[];
  summary: string;
}

// API Response types
export interface ProcessedChapterResponse {
  transcription: string;
  course: StructuredCourse | LegacyStructuredCourse | SimpleCourse; // Support new, legacy and simple formats
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
  lesson_id?: string;
}

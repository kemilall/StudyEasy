export type RootStackParamList = {
  MainTabs: undefined;
  Chapter: { chapterId: string };
  Transcription: { chapterId: string };
  Flashcards: { chapterId: string };
  Quiz: { chapterId: string };
  Chat: { chapterId: string };
  AudioImportScreen: { lessonId: string; chapterName?: string } | undefined;
  CreateSubject: undefined;
  CreateLesson: { subjectId?: string };
  CreateChapter: { lessonId?: string };
  ProcessingScreen: {
    chapterId: string;
    lessonId: string;
    audioUrl?: string; // remote URL (Firebase) optional
    documentText?: string;
    localUri?: string; // local file URI to send to backend
    fileName?: string;
    mimeType?: string;
  } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Subjects: undefined;
  Settings: undefined;
};

export type SubjectsStackParamList = {
  SubjectsList: undefined;
  Subject: { subjectId: string };
  Lesson: { lessonId: string };
};
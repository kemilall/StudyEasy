export type RootStackParamList = {
  MainTabs: undefined;
  Chapter: { chapterId: string };
  Transcription: { chapterId: string };
  Flashcards: { chapterId: string };
  Quiz: { chapterId: string };
  Chat: { chapterId: string };
  AudioImportScreen: { lessonId: string; name: string; description?: string };
  CreateSubjectScreen: undefined;
  CreateLessonScreen: { subjectId?: string };
  CreateChapterScreen: { lessonId?: string };
  ProcessingScreen: { chapterId: string };
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

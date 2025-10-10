export type RootStackParamList = {
  MainTabs: undefined;
  Chapter: { chapterId: string };
  Transcription: { chapterId: string };
  Flashcards: { chapterId: string };
  Quiz: { chapterId: string };
  Chat: { chapterId: string };
  AudioImportScreen: undefined;
  CreateSubjectScreen: undefined;
  CreateLessonScreen: { subjectId?: string };
  CreateChapterScreen: { lessonId?: string };
  ProcessingScreen: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Subjects: undefined;
  Profile: undefined;
};

export type SubjectsStackParamList = {
  SubjectsList: undefined;
  Subject: { subjectId: string };
  Lesson: { lessonId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  LegalNotice: undefined;
  PrivacyPolicy: undefined;
  Subscription: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  EmailAuth: { mode: 'login' | 'signup' };
};
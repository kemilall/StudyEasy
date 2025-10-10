export type RootStackParamList = {
  Auth: undefined;
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

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
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
  Subscription: undefined;
  LegalNotice: undefined;
  TermsOfUse: undefined;
  PrivacyPolicy: undefined;
};
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  SignUp: undefined;
  Lesson: { lessonId: string };
  Transcription: { lessonId: string };
  Flashcards: { lessonId: string };
  Quiz: { lessonId: string };
  Chat: { lessonId: string };
  AudioImport: { subjectId: string; initialLessonName?: string } | undefined;
  RecordingSubjectPicker: { initialLessonName?: string } | undefined;
  RecordingStudio: {
    subjectId: string;
    subjectName: string;
    subjectColor?: string;
    lessonId?: string;
    initialLessonName?: string;
  };
  CreateSubject: undefined;
  CreateLesson: { subjectId?: string };
  ProcessingScreen: {
    lessonId: string;
    subjectId?: string;
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
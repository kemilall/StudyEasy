import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  getDoc,
} from 'firebase/firestore';

import { firestore } from './config';
import { getCurrentUserId } from '../state/session';
import { Subject, Lesson, Chapter } from '../types';

const getSubjectsCollection = (userId: string) => collection(firestore, `users/${userId}/subjects`);
const getLessonsCollection = (userId: string) => collection(firestore, `users/${userId}/lessons`);
const getChaptersCollection = (userId: string) => collection(firestore, `users/${userId}/chapters`);

export const cacheSubjects = async (subjects: Subject[]) => {
  const userId = getCurrentUserId();
  if (!userId || subjects.length === 0) return;
  const batch = writeBatch(firestore);
  subjects.forEach((subject) => {
    const ref = doc(firestore, `users/${userId}/subjects/${subject.id}`);
    batch.set(ref, subject, { merge: true });
  });
  await batch.commit();
};

export const cacheLessons = async (lessons: Lesson[]) => {
  const userId = getCurrentUserId();
  if (!userId || lessons.length === 0) return;
  const batch = writeBatch(firestore);
  lessons.forEach((lesson) => {
    const ref = doc(firestore, `users/${userId}/lessons/${lesson.id}`);
    batch.set(ref, lesson, { merge: true });
  });
  await batch.commit();
};

export const cacheChapters = async (chapters: Chapter[]) => {
  const userId = getCurrentUserId();
  if (!userId || chapters.length === 0) return;
  const batch = writeBatch(firestore);
  chapters.forEach((chapter) => {
    const ref = doc(firestore, `users/${userId}/chapters/${chapter.id}`);
    batch.set(ref, chapter, { merge: true });
  });
  await batch.commit();
};

export const cacheChapter = async (chapter: Chapter) => {
  await cacheChapters([chapter]);
};

export const cacheSubject = async (subject: Subject) => {
  await cacheSubjects([subject]);
};

export const cacheLesson = async (lesson: Lesson) => {
  await cacheLessons([lesson]);
};

export const loadCachedSubjects = async (): Promise<Subject[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const snapshot = await getDocs(getSubjectsCollection(userId));
  return snapshot.docs.map((docSnap) => docSnap.data() as Subject);
};

export const loadCachedLessons = async (subjectId: string): Promise<Lesson[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const q = query(getLessonsCollection(userId), where('subjectId', '==', subjectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as Lesson);
};

export const loadCachedLesson = async (lessonId: string): Promise<Lesson | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const ref = doc(firestore, `users/${userId}/lessons/${lessonId}`);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as Lesson) : null;
};

export const loadCachedChapters = async (lessonId: string): Promise<Chapter[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const q = query(getChaptersCollection(userId), where('lessonId', '==', lessonId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as Chapter);
};

export const loadCachedChapter = async (chapterId: string): Promise<Chapter | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const ref = doc(firestore, `users/${userId}/chapters/${chapterId}`);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as Chapter) : null;
};

export const loadCachedSubject = async (subjectId: string): Promise<Subject | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const ref = doc(firestore, `users/${userId}/subjects/${subjectId}`);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as Subject) : null;
};

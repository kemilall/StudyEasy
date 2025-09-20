import { Chapter, Flashcard, Lesson, QuizQuestion, Subject, ChatMessage } from '../types';
import { request, upload } from './client';
import {
  cacheChapter,
  cacheChapters,
  cacheLesson,
  cacheLessons,
  cacheSubject,
  cacheSubjects,
  loadCachedChapter,
  loadCachedChapters,
  loadCachedLesson,
  loadCachedLessons,
  loadCachedSubject,
  loadCachedSubjects,
} from '../firebase/firestore';

interface RawChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatResponse {
  messages: RawChatMessage[];
  assistant_message: RawChatMessage;
}

type ChapterPayload = {
  lessonId: string;
  name: string;
  description?: string;
};

export async function fetchSubjects(): Promise<Subject[]> {
  const cached = await loadCachedSubjects();
  try {
    const data = await request<Subject[]>('/subjects');
    await cacheSubjects(data);
    return data;
  } catch (error) {
    if (cached.length) {
      return cached;
    }
    throw error;
  }
}

export async function fetchSubject(subjectId: string): Promise<Subject> {
  const fromCache = await loadCachedSubject(subjectId);
  try {
    const data = await request<Subject>(`/subjects/${subjectId}`);
    await cacheSubject(data);
    return data;
  } catch (error) {
    if (fromCache) {
      return fromCache;
    }
    throw error;
  }
}

export async function createSubject(payload: { name: string; color: string; description?: string }): Promise<Subject> {
  const subject = await request<Subject>('/subjects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  await cacheSubject(subject);
  return subject;
}

export async function fetchLessonsBySubject(subjectId: string): Promise<Lesson[]> {
  const cached = await loadCachedLessons(subjectId);
  try {
    const data = await request<Lesson[]>(`/lessons/by-subject/${subjectId}`);
    await cacheLessons(data);
    return data;
  } catch (error) {
    if (cached.length) {
      return cached;
    }
    throw error;
  }
}

export async function createLesson(payload: { subjectId: string; name: string; description?: string }): Promise<Lesson> {
  const lesson = await request<Lesson>('/lessons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  await cacheLesson(lesson);
  return lesson;
}

export async function fetchLesson(lessonId: string): Promise<Lesson> {
  const cached = await loadCachedLesson(lessonId);
  try {
    const lesson = await request<Lesson>(`/lessons/${lessonId}`);
    await cacheLesson(lesson);
    return lesson;
  } catch (error) {
    if (cached) {
      return cached;
    }
    throw error;
  }
}

export async function fetchChaptersByLesson(lessonId: string): Promise<Chapter[]> {
  const cached = await loadCachedChapters(lessonId);
  try {
    const chapters = await request<Chapter[]>(`/chapters/by-lesson/${lessonId}`);
    await cacheChapters(chapters);
    return chapters;
  } catch (error) {
    if (cached.length) {
      return cached;
    }
    throw error;
  }
}

export async function fetchChapter(chapterId: string): Promise<Chapter> {
  const cached = await loadCachedChapter(chapterId);
  try {
    const chapter = await request<Chapter>(`/chapters/${chapterId}`);
    await cacheChapter(chapter);
    return chapter;
  } catch (error) {
    if (cached) {
      return cached;
    }
    throw error;
  }
}

export async function createChapterFromText(payload: ChapterPayload & { textInput: string }): Promise<Chapter> {
  const chapter = await request<Chapter>('/chapters/from-text', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  await cacheChapter(chapter);
  return chapter;
}

export async function createChapterFromAudio(payload: ChapterPayload & { audio: { uri: string; type?: string; name?: string } }): Promise<Chapter> {
  const formData = new FormData();
  formData.append('lessonId', payload.lessonId);
  formData.append('name', payload.name);
  if (payload.description) {
    formData.append('description', payload.description);
  }

  const file = {
    uri: payload.audio.uri,
    name: payload.audio.name ?? 'audio.mp3',
    type: payload.audio.type ?? 'audio/mpeg',
  } as any;

  formData.append('audio_file', file);

  const chapter = await upload<Chapter>('/chapters/from-audio', formData);
  await cacheChapter(chapter);
  return chapter;
}

export async function createChapterFromAudioUrl(payload: ChapterPayload & { audioUrl: string }): Promise<Chapter> {
  const chapter = await request<Chapter>('/chapters/from-audio-url', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  await cacheChapter(chapter);
  return chapter;
}

export async function fetchFlashcards(chapterId: string): Promise<Flashcard[]> {
  return request<Flashcard[]>(`/chapters/${chapterId}/flashcards`);
}

export async function fetchQuiz(chapterId: string): Promise<QuizQuestion[]> {
  return request<QuizQuestion[]>(`/chapters/${chapterId}/quiz`);
}

export async function fetchChatHistory(chapterId: string): Promise<ChatMessage[]> {
  const data = await request<RawChatMessage[]>(`/chat/${chapterId}`);
  return data.map(mapChatMessage);
}

export async function sendChatMessage(chapterId: string, content: string): Promise<ChatMessage[]> {
  const data = await request<ChatResponse>(`/chat/${chapterId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return data.messages.map(mapChatMessage);
}

function mapChatMessage(message: RawChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.created_at),
  };
}

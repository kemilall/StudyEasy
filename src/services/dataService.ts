import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Subject, Lesson, Chapter } from '../types';

export class DataService {
  // SUBJECTS

  // Create subject
  static async createSubject(userId: string, subjectData: Omit<Subject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      
      // Remove undefined fields
      const cleanSubjectData = Object.fromEntries(
        Object.entries(subjectData).filter(([_, value]) => value !== undefined)
      );
      
      const subject = {
        ...cleanSubjectData,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };
      
      const docRef = await addDoc(collection(db, 'subjects'), subject);
      return docRef.id;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  // Get all subjects for user
  static async getUserSubjects(userId: string): Promise<Subject[]> {
    try {
      const q = query(
        collection(db, 'subjects'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Subject));
    } catch (error) {
      console.error('Error getting subjects:', error);
      throw error;
    }
  }

  // Update subject
  static async updateSubject(subjectId: string, updates: Partial<Subject>): Promise<void> {
    try {
      const subjectRef = doc(db, 'subjects', subjectId);
      await updateDoc(subjectRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  }

  // Delete subject
  static async deleteSubject(subjectId: string): Promise<void> {
    try {
      // First delete all lessons and chapters
      const lessons = await this.getSubjectLessons(subjectId);
      for (const lesson of lessons) {
        await this.deleteLesson(lesson.id);
      }
      
      // Then delete the subject
      await deleteDoc(doc(db, 'subjects', subjectId));
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  // LESSONS

  // Create lesson
  static async createLesson(userId: string, lessonData: Omit<Lesson, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      
      // Remove undefined fields
      const cleanLessonData = Object.fromEntries(
        Object.entries(lessonData).filter(([_, value]) => value !== undefined)
      );
      
      const lesson = {
        ...cleanLessonData,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };
      
      const docRef = await addDoc(collection(db, 'lessons'), lesson);
      
      // Update subject lesson count
      await this.updateSubjectLessonCount(lessonData.subjectId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  // Get lessons for a subject
  static async getSubjectLessons(subjectId: string): Promise<Lesson[]> {
    try {
      const q = query(
        collection(db, 'lessons'),
        where('subjectId', '==', subjectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Lesson));
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  }

  // Update lesson
  static async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<void> {
    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      await updateDoc(lessonRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  // Delete lesson
  static async deleteLesson(lessonId: string): Promise<void> {
    try {
      // First delete all chapters
      const chapters = await this.getLessonChapters(lessonId);
      for (const chapter of chapters) {
        await this.deleteChapter(chapter.id);
      }
      
      // Get lesson to update subject count
      const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
      const lesson = lessonDoc.data() as Lesson;
      
      // Delete the lesson
      await deleteDoc(doc(db, 'lessons', lessonId));
      
      // Update subject lesson count
      if (lesson) {
        await this.updateSubjectLessonCount(lesson.subjectId);
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }

  // CHAPTERS

  // Create chapter
  static async createChapter(userId: string, chapterData: Omit<Chapter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      
      // Remove undefined fields
      const cleanChapterData = Object.fromEntries(
        Object.entries(chapterData).filter(([_, value]) => value !== undefined)
      );
      
      const chapter = {
        ...cleanChapterData,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };
      
      const docRef = await addDoc(collection(db, 'chapters'), chapter);
      
      // Update lesson chapter count
      await this.updateLessonChapterCount(chapterData.lessonId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating chapter:', error);
      throw error;
    }
  }

  // Get chapters for a lesson
  static async getLessonChapters(lessonId: string): Promise<Chapter[]> {
    try {
      const q = query(
        collection(db, 'chapters'),
        where('lessonId', '==', lessonId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Chapter));
    } catch (error) {
      console.error('Error getting chapters:', error);
      throw error;
    }
  }

  // Get single lesson
  static async getLesson(lessonId: string): Promise<Lesson | null> {
    try {
      const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
      if (lessonDoc.exists()) {
        return {
          id: lessonDoc.id,
          ...lessonDoc.data(),
          createdAt: lessonDoc.data().createdAt.toDate(),
          updatedAt: lessonDoc.data().updatedAt.toDate()
        } as Lesson;
      }
      return null;
    } catch (error) {
      console.error('Error getting lesson:', error);
      throw error;
    }
  }

  // Get single chapter
  static async getChapter(chapterId: string): Promise<Chapter | null> {
    try {
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
      if (chapterDoc.exists()) {
        return {
          id: chapterDoc.id,
          ...chapterDoc.data(),
          createdAt: chapterDoc.data().createdAt.toDate(),
          updatedAt: chapterDoc.data().updatedAt.toDate()
        } as Chapter;
      }
      return null;
    } catch (error) {
      console.error('Error getting chapter:', error);
      throw error;
    }
  }

  // Update chapter
  static async updateChapter(chapterId: string, updates: Partial<Chapter>): Promise<void> {
    try {
      const chapterRef = doc(db, 'chapters', chapterId);
      await updateDoc(chapterRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // If completion status changed, update lesson counts
      if (updates.isCompleted !== undefined) {
        const chapterDoc = await getDoc(chapterRef);
        const chapter = chapterDoc.data() as Chapter;
        if (chapter) {
          await this.updateLessonChapterCount(chapter.lessonId);
        }
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    }
  }

  // Delete chapter
  static async deleteChapter(chapterId: string): Promise<void> {
    try {
      // Get chapter to update lesson count
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
      const chapter = chapterDoc.data() as Chapter;
      
      // Delete the chapter
      await deleteDoc(doc(db, 'chapters', chapterId));
      
      // Update lesson chapter count
      if (chapter) {
        await this.updateLessonChapterCount(chapter.lessonId);
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  }

  // HELPER METHODS

  // Update subject lesson count
  private static async updateSubjectLessonCount(subjectId: string): Promise<void> {
    try {
      const lessons = await this.getSubjectLessons(subjectId);
      const completedLessons = lessons.filter(lesson => 
        lesson.completedChapters === lesson.chaptersCount && lesson.chaptersCount > 0
      ).length;
      
      await this.updateSubject(subjectId, {
        lessonsCount: lessons.length,
        completedLessons
      });
    } catch (error) {
      console.error('Error updating subject lesson count:', error);
    }
  }

  // Update lesson chapter count
  private static async updateLessonChapterCount(lessonId: string): Promise<void> {
    try {
      const chapters = await this.getLessonChapters(lessonId);
      const completedChapters = chapters.filter(chapter => chapter.isCompleted).length;
      
      await this.updateLesson(lessonId, {
        chaptersCount: chapters.length,
        completedChapters,
        duration: chapters.reduce((total, chapter) => total + chapter.duration, 0)
      });
      
      // Update subject counts as well
      const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
      const lesson = lessonDoc.data() as Lesson;
      if (lesson) {
        await this.updateSubjectLessonCount(lesson.subjectId);
      }
    } catch (error) {
      console.error('Error updating lesson chapter count:', error);
    }
  }

  // Real-time listeners
  static subscribeToUserSubjects(userId: string, callback: (subjects: Subject[]) => void) {
    const q = query(
      collection(db, 'subjects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const subjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Subject));
      callback(subjects);
    });
  }

  static subscribeToSubjectLessons(subjectId: string, callback: (lessons: Lesson[]) => void) {
    const q = query(
      collection(db, 'lessons'),
      where('subjectId', '==', subjectId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const lessons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Lesson));
      callback(lessons);
    });
  }

  static subscribeToLessonChapters(lessonId: string, callback: (chapters: Chapter[]) => void) {
    const q = query(
      collection(db, 'chapters'),
      where('lessonId', '==', lessonId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const chapters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Chapter));
      callback(chapters);
    });
  }

  // Get recent chapters for user (from all subjects)
  static async getRecentChapters(userId: string, limit: number = 10): Promise<Chapter[]> {
    try {
      const q = query(
        collection(db, 'chapters'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chapters = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Chapter));

      // Enrich chapters with subject and lesson info
      const enrichedChapters = await Promise.all(
        chapters.slice(0, limit).map(async (chapter) => {
          try {
            // Get lesson info
            const lesson = await this.getLesson(chapter.lessonId);
            
            // Get subject info
            let subjectName = 'Matière inconnue';
            let subjectColor = '#3498DB';
            if (lesson) {
              const subjectDoc = await getDoc(doc(db, 'subjects', lesson.subjectId));
              if (subjectDoc.exists()) {
                const subject = subjectDoc.data() as Subject;
                subjectName = subject.name;
                subjectColor = subject.color;
              }
            }
            
            return {
              ...chapter,
              subjectName,
              subjectColor,
              lessonName: lesson?.name || 'Leçon inconnue',
              subjectId: lesson?.subjectId || '',
            };
          } catch (error) {
            console.error('Error enriching chapter:', error);
            return {
              ...chapter,
              subjectName: 'Matière inconnue',
              subjectColor: '#3498DB',
              lessonName: 'Leçon inconnue',
              subjectId: '',
            };
          }
        })
      );
      
      return enrichedChapters;
    } catch (error) {
      console.error('Error getting recent chapters:', error);
      throw error;
    }
  }

  // Subscribe to recent chapters
  static subscribeToRecentChapters(userId: string, callback: (chapters: Chapter[]) => void, limit: number = 10) {
    const q = query(
      collection(db, 'chapters'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, async (snapshot) => {
      const chapters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Chapter));

      // Enrich chapters with subject and lesson info
      const enrichedChapters = await Promise.all(
        chapters.slice(0, limit).map(async (chapter) => {
          try {
            // Get lesson info
            const lesson = await this.getLesson(chapter.lessonId);
            
            // Get subject info
            let subjectName = 'Matière inconnue';
            let subjectColor = '#3498DB';
            if (lesson) {
              const subjectDoc = await getDoc(doc(db, 'subjects', lesson.subjectId));
              if (subjectDoc.exists()) {
                const subject = subjectDoc.data() as Subject;
                subjectName = subject.name;
                subjectColor = subject.color;
              }
            }
            
            return {
              ...chapter,
              subjectName,
              subjectColor,
              lessonName: lesson?.name || 'Leçon inconnue',
              subjectId: lesson?.subjectId || '',
            };
          } catch (error) {
            console.error('Error enriching chapter:', error);
            return {
              ...chapter,
              subjectName: 'Matière inconnue',
              subjectColor: '#3498DB',
              lessonName: 'Leçon inconnue',
              subjectId: '',
            };
          }
        })
      );
      
      callback(enrichedChapters);
    });
  }
}

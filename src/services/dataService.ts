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
import { Subject, Lesson } from '../types';

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
      // First delete all lessons
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

  // Update lesson
  static async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<void> {
    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      await updateDoc(lessonRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });

      // If completion status changed, update subject counts
      if (updates.isCompleted !== undefined) {
        const lessonDoc = await getDoc(lessonRef);
        const lesson = lessonDoc.data() as Lesson;
        if (lesson) {
          await this.updateSubjectLessonCount(lesson.subjectId);
        }
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  // HELPER METHODS

  // Update subject lesson count
  private static async updateSubjectLessonCount(subjectId: string): Promise<void> {
    try {
      const lessons = await this.getSubjectLessons(subjectId);
      const completedLessons = lessons.filter(lesson => lesson.isCompleted).length;

      await this.updateSubject(subjectId, {
        lessonsCount: lessons.length,
        completedLessons
      });
    } catch (error) {
      console.error('Error updating subject lesson count:', error);
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

  // Get recent lessons for user (from all subjects)
  static async getRecentLessons(userId: string, limit: number = 10): Promise<Lesson[]> {
    try {
      const q = query(
        collection(db, 'lessons'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const lessons = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Lesson));

      // Enrich lessons with subject info
      const enrichedLessons = await Promise.all(
        lessons.slice(0, limit).map(async (lesson) => {
          try {
            // Get subject info
            const subjectDoc = await getDoc(doc(db, 'subjects', lesson.subjectId));
            let subjectName = 'Matière inconnue';
            let subjectColor = '#3498DB';
            if (subjectDoc.exists()) {
              const subject = subjectDoc.data() as Subject;
              subjectName = subject.name;
              subjectColor = subject.color;
            }

            return {
              ...lesson,
              subjectName,
              subjectColor,
            };
          } catch (error) {
            console.error('Error enriching lesson:', error);
            return {
              ...lesson,
              subjectName: 'Matière inconnue',
              subjectColor: '#3498DB',
            };
          }
        })
      );

      return enrichedLessons;
    } catch (error) {
      console.error('Error getting recent lessons:', error);
      throw error;
    }
  }

  // Subscribe to recent lessons
  static subscribeToRecentLessons(userId: string, callback: (lessons: Lesson[]) => void, limit: number = 10) {
    const q = query(
      collection(db, 'lessons'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const lessons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as Lesson));

      // Enrich lessons with subject info
      const enrichedLessons = await Promise.all(
        lessons.slice(0, limit).map(async (lesson) => {
          try {
            // Get subject info
            const subjectDoc = await getDoc(doc(db, 'subjects', lesson.subjectId));
            let subjectName = 'Matière inconnue';
            let subjectColor = '#3498DB';
            if (subjectDoc.exists()) {
              const subject = subjectDoc.data() as Subject;
              subjectName = subject.name;
              subjectColor = subject.color;
            }

            return {
              ...lesson,
              subjectName,
              subjectColor,
            };
          } catch (error) {
            console.error('Error enriching lesson:', error);
            return {
              ...lesson,
              subjectName: 'Matière inconnue',
              subjectColor: '#3498DB',
            };
          }
        })
      );

      callback(enrichedLessons);
    });
  }
}

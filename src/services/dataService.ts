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
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Subject, Lesson, RecordingDraft } from '../types';

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
      // Mark the subject as deleting
      await this.updateSubject(subjectId, { isDeleting: true });

      // First delete all lessons
      const lessons = await this.getSubjectLessons(subjectId);
      for (const lesson of lessons) {
        await this.deleteLesson(lesson.id);
      }

      // Then delete the subject
      await deleteDoc(doc(db, 'subjects', subjectId));
    } catch (error) {
      console.error('Error deleting subject:', error);
      // Remove the deleting flag if there's an error
      try {
        await this.updateSubject(subjectId, { isDeleting: false });
      } catch (updateError) {
        console.error('Error removing deleting flag:', updateError);
      }
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
      if (!lessonId || typeof lessonId !== 'string') {
        throw new Error('Invalid lessonId provided to getLesson');
      }
      const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
      if (lessonDoc.exists()) {
        const data = lessonDoc.data();
        console.log('Lesson data keys:', Object.keys(data || {}));
        console.log('Lesson data:', data);

        if (!data) {
          console.error('Lesson document exists but has no data');
          return null;
        }

        // Validate data structure
        const requiredFields = ['name', 'subjectId', 'userId'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
          console.error('Lesson missing required fields:', missingFields, 'Data:', data);
          return null;
        }

        // Check if dates exist and are valid Firestore timestamps
        if (!data.createdAt || !data.updatedAt) {
          console.error('Lesson missing required date fields:', { createdAt: data.createdAt, updatedAt: data.updatedAt });
          return null;
        }

        // Validate that dates are Firestore Timestamp objects
        const hasValidCreatedAt = data.createdAt && data.createdAt.seconds && data.createdAt.nanoseconds;
        const hasValidUpdatedAt = data.updatedAt && data.updatedAt.seconds && data.updatedAt.nanoseconds;
        
        if (!hasValidCreatedAt || !hasValidUpdatedAt) {
          console.error('Invalid date format in lesson:', { 
            createdAt: data.createdAt, 
            updatedAt: data.updatedAt,
            hasValidCreatedAt,
            hasValidUpdatedAt
          });
          return null;
        }

        try {
          // Create timestamp objects manually to avoid toDate() method issues
          const createdAt = new Date(data.createdAt.seconds * 1000 + data.createdAt.nanoseconds / 1000000);
          const updatedAt = new Date(data.updatedAt.seconds * 1000 + data.updatedAt.nanoseconds / 1000000);

          // Clean the data to avoid issues with complex objects
          const cleanData = { ...data };
          delete cleanData.createdAt;
          delete cleanData.updatedAt;

          // Ensure audioUrl is a string (it might be causing the indexOf issue)
          if (cleanData.audioUrl && typeof cleanData.audioUrl !== 'string') {
            console.warn('audioUrl is not a string:', typeof cleanData.audioUrl, cleanData.audioUrl);
            cleanData.audioUrl = String(cleanData.audioUrl);
          }

          return {
            id: lessonDoc.id,
            ...cleanData,
            createdAt,
            updatedAt
          } as Lesson;
        } catch (dateError) {
          console.error('Error processing lesson:', dateError);
          console.error('Error stack:', dateError.stack);
          console.error('Data that caused error:', data);
          // Return lesson with current date if date conversion fails
          return {
            id: lessonDoc.id,
            name: data.name || '',
            subjectId: data.subjectId || '',
            userId: data.userId || '',
            status: data.status || 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
          } as Lesson;
        }
      }
      console.log('Lesson document does not exist:', lessonId);
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
      if (updates.isCompleted !== undefined || updates.status !== undefined) {
        const lessonDoc = await getDoc(lessonRef);
        const lessonData = lessonDoc.data();
        if (lessonData && lessonData.subjectId) {
          await this.updateSubjectLessonCount(lessonData.subjectId);
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
      const lessons = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        } as Lesson))
        .filter(lesson => lesson.status !== 'draft'); // Exclure les drafts
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
      const lessons = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        } as Lesson))
        .filter(lesson => lesson.status !== 'draft'); // Exclure les drafts

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

  // RECORDING DRAFTS

  static async saveRecordingDraft(userId: string, draft: RecordingDraft): Promise<void> {
    try {
      const draftRef = doc(db, 'users', userId, 'recordingDrafts', draft.id);
      await setDoc(draftRef, draft);
    } catch (error) {
      console.error('Error saving recording draft:', error);
      throw error;
    }
  }

  static subscribeToRecordingDrafts(userId: string, callback: (drafts: RecordingDraft[]) => void) {
    const draftsRef = collection(db, 'users', userId, 'recordingDrafts');
    const q = query(draftsRef, orderBy('updatedAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const drafts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RecordingDraft));
      callback(drafts);
    });
  }

  static async deleteRecordingDraft(userId: string, draftId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId, 'recordingDrafts', draftId));
    } catch (error) {
      console.error('Error deleting recording draft:', error);
      throw error;
    }
  }
}

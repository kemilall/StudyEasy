import { Flashcard, QuizQuestion, Lesson, Subject } from '../types';
import { DataService } from './dataService';
import { API_BASE_URL } from '../config/api';

// API base URL now resolved dynamically for simulator/device
// Force reload: ${Date.now()}

interface ProcessedChapterResponse {
  transcription: string;
  course: {
    title: string;
    introduction: string;
    sections: Array<{ heading: string; content: string }>;
    key_points: string[];
    summary: string;
  };
  flashcards: Array<{
    term: string;
    definition: string;
    example?: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }>;
  key_points: string[];
  summary: string;
}

export interface ProcessingStatus {
  chapter_id: string;
  current_step: number;
  total_steps: number;
  step_name: string;
  step_description: string;
  is_completed: boolean;
  error?: string;
}

export class AIService {
  // Get processing status for a chapter
  static async getProcessingStatus(chapterId: string): Promise<ProcessingStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/processing-status/${chapterId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get processing status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting processing status:', error);
      throw error;
    }
  }

  // Transcribe audio file
  static async transcribeAudio(
    audioUri: string,
    originalFileName?: string,
    originalMimeType?: string,
    chapterId?: string
  ): Promise<string> {
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Transcribing audio:', { audioUri, originalFileName, originalMimeType });
    
    try {
      // Determine extension and mime type
      const inferExtFromMime = (mime?: string) => {
        if (!mime) return 'm4a';
        const map: Record<string, string> = {
          'audio/mpeg': 'mp3',
          'audio/mp3': 'mp3',
          'audio/x-m4a': 'm4a',
          'audio/aac': 'aac',
          'audio/wav': 'wav',
          'audio/vnd.wave': 'wav',
          'audio/ogg': 'ogg',
          'audio/webm': 'webm',
          'audio/mp4': 'm4a',
        };
        return map[mime] || 'm4a';
      };
      const inferMimeFromExt = (ext?: string) => {
        if (!ext) return 'audio/m4a';
        const map: Record<string, string> = {
          mp3: 'audio/mpeg',
          m4a: 'audio/x-m4a',
          aac: 'audio/aac',
          wav: 'audio/wav',
          ogg: 'audio/ogg',
          webm: 'audio/webm',
        };
        return map[ext] || 'audio/m4a';
      };

      const providedExt = originalFileName?.split('.')?.pop()?.toLowerCase();
      const ext = providedExt || inferExtFromMime(originalMimeType);
      const mimeType = originalMimeType || inferMimeFromExt(ext);
      const fileName = originalFileName || `audio.${ext}`;

      // Ensure we have a local file URI to attach to FormData
      const localUri = audioUri;

      const formData = new FormData();
      // In React Native, append a file object with uri, name, type
      formData.append('file', {
        uri: localUri,
        name: fileName,
        type: mimeType,
      } as any);
      
      // Add chapter_id if provided for progress tracking
      if (chapterId) {
        formData.append('chapter_id', chapterId);
      }

      const transcribeUrl = `${API_BASE_URL}/api/transcribe`;
      console.log('Calling transcribe endpoint:', transcribeUrl);
      
      const uploadResponse = await fetch(transcribeUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Transcription failed: ${uploadResponse.statusText} - ${errorText}`);
      }

      const data = await uploadResponse.json();
      return data.transcription;
    } catch (error) {
      console.error('Transcription error (file object attempt):', error);

      // Fallback: read file as blob via XMLHttpRequest and upload as blob
      try {
        const blob: Blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            resolve(xhr.response as any);
          };
          xhr.onerror = function () {
            reject(new TypeError('Failed to read local file via XHR'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', audioUri, true);
          xhr.send(null);
        });

        const providedExt = originalFileName?.split('.')?.pop()?.toLowerCase();
        const ext = providedExt || 'm4a';
        const fileName = originalFileName || `audio.${ext}`;

        const fallbackForm = new FormData();
        fallbackForm.append('file', blob as any, fileName);

        const resp = await fetch(`${API_BASE_URL}/api/transcribe`, {
          method: 'POST',
          body: fallbackForm,
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(`Transcription failed (fallback): ${resp.statusText} - ${errorText}`);
        }

        const data = await resp.json();
        return data.transcription;
      } catch (fallbackErr) {
        console.error('Transcription fallback error (XHR blob):', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  // Process chapter with AI
  static async processChapter(
    chapterId: string, 
    audioUrl?: string, 
    documentText?: string,
    chapterInfo?: { chapter: Chapter; lesson: Lesson; subject: Subject },
    originalFileName?: string,
    originalMimeType?: string
  ): Promise<{
    transcription?: string;
    summary: string;
    bulletPoints: string[];
    flashcards: Flashcard[];
    quiz: QuizQuestion[];
    processingChapterId?: string; // Backend chapter_id for progress tracking
  }> {
    try {
      let text = documentText || '';
      
      // If there's an audio file, transcribe it first  
      // Generate a unique processing ID for progress tracking
      let processingChapterId: string | undefined;
      
      if (audioUrl && !documentText) {
        text = await this.transcribeAudio(audioUrl, originalFileName, originalMimeType);
      }
      
      // Process the chapter with AI
      const response = await fetch(`${API_BASE_URL}/api/process-chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          chapter_name: chapterInfo?.chapter.name || 'Chapitre',
          lesson_name: chapterInfo?.lesson.name || 'Leçon',
          subject_name: chapterInfo?.subject.name || 'Matière',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }
      
      const data: ProcessedChapterResponse & { chapter_id?: string } = await response.json();
      
      // Extract processing chapter ID from response
      processingChapterId = data.chapter_id;
      
      // Transform the response to match our frontend format
      const flashcards: Flashcard[] = data.flashcards.map((fc, index) => ({
        id: `${index + 1}`,
        question: fc.term,
        answer: fc.definition + (fc.example ? `\n\nExemple: ${fc.example}` : ''),
      }));
      
      const quiz: QuizQuestion[] = data.quiz.map((q, index) => ({
        id: `${index + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      }));
      
      // Update lesson in Firebase with the generated content
      if (chapterId) {
        await DataService.updateLesson(chapterId, {
          transcription: data.transcription,
          summary: data.summary,
          keyPoints: data.key_points,
          flashcards,
          quiz,
        });
      }
    
    return {
        transcription: data.transcription,
        summary: data.summary,
        bulletPoints: data.key_points,
        flashcards,
        quiz,
        processingChapterId, // Return the backend chapter ID for progress tracking
      };
    } catch (error) {
      console.error('Chapter processing error:', error);
      throw error;
    }
  }

  // Chat with AI about the course
  static async chatWithCourse(
    message: string,
    context: string,
    chatHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          chat_history: chatHistory || [],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  // Generate flashcards from text
  static async generateFlashcards(
    text: string,
    maxCards: number = 10
  ): Promise<Array<{ id: string; question: string; answer: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          max_cards: maxCards,
        }),
      });

      if (!response.ok) {
        throw new Error(`Flashcard generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const flashcards = data.flashcards || [];

      // Transform to frontend format
      return flashcards.map((fc: any, index: number) => ({
        id: `${index + 1}`,
        question: fc.term,
        answer: fc.definition + (fc.example ? `\n\nExemple: ${fc.example}` : ''),
      }));
    } catch (error) {
      console.error('Flashcard generation error:', error);
      throw error;
    }
  }

  // Generate quiz from text
  static async generateQuiz(
    text: string,
    numQuestions: number = 5
  ): Promise<Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          num_questions: numQuestions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Quiz generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const questions = data.quiz || [];

      // Transform to frontend format
      return questions.map((q: any, index: number) => ({
        id: `${index + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      }));
    } catch (error) {
      console.error('Quiz generation error:', error);
      throw error;
    }
  }

  // Generate course from text
  static async generateCourse(
    text: string,
    chapterName: string,
    lessonName: string,
    subjectName: string
  ): Promise<{
    title: string;
    introduction: string;
    sections: Array<{ heading: string; content: string }>;
    key_points: string[];
    summary: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          chapter_name: chapterName,
          lesson_name: lessonName,
          subject_name: subjectName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Course generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.course;
    } catch (error) {
      console.error('Course generation error:', error);
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  static async generateTranscription(audioUrl: string): Promise<string> {
    return this.transcribeAudio(audioUrl);
  }

  static async generateSummary(transcription: string): Promise<string> {
    // This is now handled by processChapter
    return "Veuillez utiliser la méthode processChapter pour générer un résumé complet.";
  }

  static async generateBulletPoints(transcription: string): Promise<string[]> {
    // This is now handled by processChapter
    return ["Veuillez utiliser la méthode processChapter pour générer les points clés."];
  }
}

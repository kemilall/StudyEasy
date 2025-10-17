import { Flashcard, QuizQuestion, Lesson, Subject } from '../types';
import { DataService } from './dataService';
import { API_BASE_URL } from '../config/api';

// API base URL now resolved dynamically for simulator/device
// Force reload: ${Date.now()}

interface ProcessedLessonResponse {
  transcription: string;
  course: {
    title: string;
    introduction: string;
    sections: Array<{ heading: string; content: string }>;
    key_points: string[];
    summary: string;
  };
  flashcards: Array<{
    type: string;
    recto: string;
    verso: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }>;
  key_points: string[];
  summary: string;
  lesson_id: string;
}

export interface ProcessingStatus {
  lesson_id: string;
  current_step: number;
  total_steps: number;
  step_name: string;
  step_description: string;
  is_completed: boolean;
  error?: string;
}

export class AIService {
  // Get processing status for a lesson
  static async getProcessingStatus(lessonId: string): Promise<ProcessingStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/processing-status/${lessonId}`);
      
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
    lessonId?: string
  ): Promise<string> {
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Transcribing audio:', { audioUri, originalFileName, originalMimeType });
    
    try {
      // Determine extension and mime type
      const inferExtFromMime = (mime?: string) => {
        if (!mime) return 'wav';
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
        return map[mime] || 'wav';
      };
      const inferMimeFromExt = (ext?: string) => {
        if (!ext) return 'audio/wav';
        const map: Record<string, string> = {
          mp3: 'audio/mpeg',
          m4a: 'audio/x-m4a',
          aac: 'audio/aac',
          wav: 'audio/wav',
          ogg: 'audio/ogg',
          webm: 'audio/webm',
        };
        return map[ext] || 'audio/wav';
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
      
      // Add lesson_id if provided for progress tracking
      if (lessonId) {
        formData.append('lesson_id', lessonId);
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
        if (lessonId) {
          fallbackForm.append('lesson_id', lessonId);
        }

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

  // Process lesson with AI
  static async processLesson(
    lessonId: string,
    audioUrl?: string,
    documentText?: string,
    lessonInfo?: { lesson: Lesson; subject: Subject },
    originalFileName?: string,
    originalMimeType?: string
  ): Promise<{
    transcription?: string;
    summary: string;
    bulletPoints: string[];
    flashcards: Flashcard[];
    quiz: QuizQuestion[];
    processingLessonId?: string; // Backend lesson_id for progress tracking
  }> {
    try {
      let text = documentText || '';
      
      // If there's an audio file, transcribe it first  
      // Generate a unique processing ID for progress tracking
      let processingLessonId: string | undefined;

      if (audioUrl && !documentText) {
        text = await this.transcribeAudio(audioUrl, originalFileName, originalMimeType);
      }

      // Process the lesson with AI
      const response = await fetch(`${API_BASE_URL}/api/process-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          chapter_name: lessonInfo?.lesson.name || 'Leçon',
          lesson_name: lessonInfo?.lesson.name || 'Leçon',
          subject_name: lessonInfo?.subject.name || 'Matière',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }
      
      const data: ProcessedLessonResponse = await response.json();

      // Extract processing lesson ID from response
      processingLessonId = data.lesson_id;
      
      // Transform the response to match our frontend format
      const flashcards: Flashcard[] = data.flashcards.map((fc, index) => ({
        id: `${index + 1}`,
        question: fc.recto,
        answer: fc.verso,
      }));
      
      const quiz: QuizQuestion[] = data.quiz.map((q, index) => ({
        id: `${index + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      }));
      
      // Update lesson in Firebase with the generated content
      if (lessonId) {
        await DataService.updateLesson(lessonId, {
          transcription: data.transcription,
          summary: data.summary,
          keyPoints: data.key_points,
          flashcards,
          quiz,
          ...(data.course && { content: JSON.stringify(data.course) }), // Store structured course as JSON only if it exists
        });
      }

    return {
        transcription: data.transcription,
        summary: data.summary,
        bulletPoints: data.key_points,
        flashcards,
        quiz,
        processingLessonId, // Return the backend lesson ID for progress tracking
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
    maxCards?: number
  ): Promise<Array<{ id: string; question: string; answer: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          ...(maxCards && { max_cards: maxCards }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Flashcard generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const flashcards = data.flashcards || [];

      // Transform to frontend format (new structure: type, recto, verso)
      return flashcards.map((fc: any, index: number) => ({
        id: `${index + 1}`,
        question: fc.recto,
        answer: fc.verso,
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

  // Generate structured course from text (enhanced version)
  static async generateCourse(
    text: string,
    chapterName: string,
    lessonName: string,
    subjectName: string
  ): Promise<{
    title: string;
    overview: {
      objective: string;
      main_ideas: string[];
      structure: string[];
    };
    sections: Array<{
      title: string;
      subsections: Array<{
        title: string;
        blocks: Array<{
          type: 'text' | 'example' | 'formula' | 'definition' | 'bullet_points' | 'summary';
          content: string;
          title?: string;
        }>;
      }>;
    }>;
    conclusion: string;
    references: string[];
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

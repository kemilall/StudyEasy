from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import logging
from ai_service import AIService
from models import (
    TranscriptionRequest,
    CourseGenerationRequest,
    FlashcardsRequest,
    QuizRequest,
    ChatRequest,
    ChatResponse,
    ProcessedChapter
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="StudyEasy AI Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Service
ai_service = AIService()

# In-memory storage for processing status
processing_status = {}

class ProcessingStatus(BaseModel):
    lesson_id: str
    current_step: int
    total_steps: int
    step_name: str
    step_description: str
    is_completed: bool
    error: Optional[str] = None

def update_processing_status(lesson_id: str, step: int, total_steps: int, step_name: str, step_description: str, is_completed: bool = False, error: str = None):
    """Update the processing status for a lesson"""
    processing_status[lesson_id] = ProcessingStatus(
        lesson_id=lesson_id,
        current_step=step,
        total_steps=total_steps,
        step_name=step_name,
        step_description=step_description,
        is_completed=is_completed,
        error=error
    )

@app.get("/")
async def root():
    return {"message": "StudyEasy AI Backend is running"}

@app.get("/api/processing-status/{lesson_id}")
async def get_processing_status(lesson_id: str):
    """Get the current processing status for a lesson"""
    if lesson_id not in processing_status:
        raise HTTPException(status_code=404, detail="Lesson processing status not found")

    status = processing_status[lesson_id]
    return {
        "lesson_id": status.lesson_id,
        "current_step": status.current_step,
        "total_steps": status.total_steps,
        "step_name": status.step_name,
        "step_description": status.step_description,
        "is_completed": status.is_completed,
        "error": status.error
    }

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...), lesson_id: str = Form(None)):
    """Transcribe audio file to text using ElevenLabs Speech-to-Text (auto language)."""
    try:
        # Validate file
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")

        # Check file size (ElevenLabs limit is typically 25MB)
        content = await file.read()
        file_size_mb = len(content) / (1024 * 1024)

        if file_size_mb > 25:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {file_size_mb:.2f}MB. Maximum allowed is 25MB"
            )

        # Check file extension
        allowed_extensions = ['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.webm']
        file_ext = os.path.splitext(file.filename or '')[1].lower()

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}. Supported formats: {', '.join(allowed_extensions)}"
            )

        # If lesson_id provided, update status
        if lesson_id:
            update_processing_status(
                lesson_id=lesson_id,
                step=1,
                total_steps=6,
                step_name="Transcription audio",
                step_description="Conversion de l'audio en texte avec l'IA"
            )

        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            buffer.write(content)

        # Log file info for debugging
        file_size = os.path.getsize(temp_path)
        logger.info(f"Saved temp file: {temp_path} (size: {file_size} bytes)")
        logger.info(f"Original filename: {file.filename}")
        logger.info(f"Content length: {len(content)} bytes")

        try:
            # Transcribe audio
            transcription = await ai_service.transcribe_audio(temp_path)
        except Exception as transcription_error:
            logger.error(f"ElevenLabs transcription failed: {str(transcription_error)}")
            # Clean up temp file on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=400,
                detail=f"Transcription service error: {str(transcription_error)}"
            )

        # Clean up temp file
        os.remove(temp_path)

        # Update status if lesson_id provided
        if lesson_id:
            update_processing_status(
                lesson_id=lesson_id,
                step=2,
                total_steps=6,
                step_name="Transcription terminée",
                step_description="Conversion audio en texte réussie"
            )

        return {"transcription": transcription}

    except HTTPException:
        raise
    except Exception as e:
        if lesson_id:
            update_processing_status(
                lesson_id=lesson_id,
                step=0,
                total_steps=6,
                step_name="Erreur transcription",
                step_description="Erreur lors de la transcription audio",
                error=str(e)
            )
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/process-lesson")
async def process_lesson(request: CourseGenerationRequest):
    """Process text input to generate complete lesson content in parallel"""
    # Generate a unique lesson_id for this processing session
    import uuid
    lesson_id = str(uuid.uuid4())

    try:
        logger.info(f"=== STARTING LESSON PROCESSING ===")
        logger.info(f"Processing text length: {len(request.text)} characters")
        logger.info(f"Lesson: {request.lesson_name}, Subject: {request.subject_name}")

        # Initialize processing status
        update_processing_status(
            lesson_id=lesson_id,
            step=0,
            total_steps=5,
            step_name="Initialisation",
            step_description="Préparation du traitement du contenu"
        )

        # Process the input text to generate all chapter content in parallel
        processed_chapter = await ai_service.process_chapter(
            text=request.text,
            chapter_name=request.chapter_name,
            lesson_name=request.lesson_name,
            subject_name=request.subject_name
        )

        # Convert ProcessedChapter to dictionary and add lesson_id
        try:
            # Try modern Pydantic method first
            course_dict = processed_chapter.course.model_dump() if hasattr(processed_chapter.course, 'model_dump') else processed_chapter.course.dict()
        except:
            # Fallback to basic dict conversion
            course_dict = processed_chapter.course.__dict__ if hasattr(processed_chapter.course, '__dict__') else processed_chapter.course

        result = {
            "transcription": processed_chapter.transcription,
            "course": course_dict,
            "flashcards": processed_chapter.flashcards,
            "quiz": processed_chapter.quiz,
            "key_points": processed_chapter.key_points,
            "summary": processed_chapter.summary,
            "lesson_id": lesson_id
        }

        logger.info(f"=== LESSON PROCESSING COMPLETED SUCCESSFULLY ===")
        return result

    except Exception as e:
        logger.error(f"Lesson processing error: {str(e)}")
        # Update status with error
        update_processing_status(
            lesson_id=lesson_id,
            step=0,
            total_steps=5,
            step_name="Erreur",
            step_description="Une erreur est survenue lors du traitement",
            error=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-lesson")
async def process_lesson(request: CourseGenerationRequest):
    """Process text input to generate complete lesson content"""
    # Generate a unique lesson_id for this processing session
    import uuid
    lesson_id = str(uuid.uuid4())

    try:
        # Initialize processing status
        update_processing_status(
            lesson_id=lesson_id,
            step=0,
            total_steps=6,
            step_name="Initialisation",
            step_description="Préparation du traitement du contenu"
        )

        # Step 1: Starting processing
        update_processing_status(
            lesson_id=lesson_id,
            step=1,
            total_steps=6,
            step_name="Analyse du contenu",
            step_description="Analyse et préparation du texte d'entrée"
        )

        # Step 2: Transcription (if needed)
        update_processing_status(
            lesson_id=lesson_id,
            step=2,
            total_steps=6,
            step_name="Transcription",
            step_description="Conversion de la parole en texte"
        )

        # Step 3: Generate course content
        update_processing_status(
            lesson_id=lesson_id,
            step=3,
            total_steps=6,
            step_name="Génération du cours",
            step_description="Création du contenu structuré du cours"
        )

        # Step 4: Generate flashcards
        update_processing_status(
            lesson_id=lesson_id,
            step=4,
            total_steps=6,
            step_name="Création des flashcards",
            step_description="Génération des cartes de révision"
        )

        # Step 5: Generate quiz
        update_processing_status(
            lesson_id=lesson_id,
            step=5,
            total_steps=6,
            step_name="Génération du quiz",
            step_description="Création des questions d'évaluation"
        )

        # Process the input text to generate all lesson content
        # (This calls the existing AI service without modifications)
        processed_lesson = await ai_service.process_chapter(
            text=request.text,
            chapter_name=request.lesson_name,  # Using lesson_name as chapter_name
            lesson_name="",  # Not used anymore
            subject_name=request.subject_name
        )

        # Final step: Completed
        update_processing_status(
            lesson_id=lesson_id,
            step=6,
            total_steps=6,
            step_name="Traitement terminé",
            step_description="Génération complète de la leçon réussie",
            is_completed=True
        )

        # Add lesson_id to response
        result = processed_lesson
        result["lesson_id"] = lesson_id

        return result

    except Exception as e:
        # Update status with error
        update_processing_status(
            lesson_id=lesson_id,
            step=0,
            total_steps=6,
            step_name="Erreur",
            step_description="Une erreur est survenue lors du traitement",
            error=str(e)
        )
        logger.error(f"Lesson processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-course")
async def generate_course(request: CourseGenerationRequest):
    """Generate structured course from text input"""
    try:
        course = await ai_service.generate_structured_course(
            text=request.text,
            chapter_name=request.chapter_name,
            lesson_name=request.lesson_name,
            subject_name=request.subject_name
        )
        
        return {"course": course}
    
    except Exception as e:
        logger.error(f"Course generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-flashcards")
async def generate_flashcards(request: FlashcardsRequest):
    """Generate flashcards from text input"""
    try:
        flashcards = await ai_service.generate_flashcards(
            text=request.text,
            max_cards=request.max_cards
        )
        
        return {"flashcards": flashcards}
    
    except Exception as e:
        logger.error(f"Flashcard generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizRequest):
    """Generate quiz questions from text input"""
    try:
        quiz = await ai_service.generate_quiz(
            text=request.text,
            num_questions=request.num_questions
        )
        
        return {"quiz": quiz}
    
    except Exception as e:
        logger.error(f"Quiz generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_course(request: ChatRequest):
    """Chat with AI about the course content"""
    try:
        response = await ai_service.chat_with_context(
            message=request.message,
            context=request.context,
            chat_history=request.chat_history
        )
        
        return ChatResponse(
            message=response,
            timestamp=request.timestamp
        )
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host=os.getenv("HOST", "0.0.0.0"), 
        port=int(os.getenv("PORT", 8000))
    )

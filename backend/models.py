from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# Request Models
class TranscriptionRequest(BaseModel):
    audio_url: str

class CourseGenerationRequest(BaseModel):
    text: str
    chapter_name: str
    lesson_name: str
    subject_name: str

class FlashcardsRequest(BaseModel):
    text: str
    max_cards: Optional[int] = 20

class QuizRequest(BaseModel):
    text: str
    num_questions: Optional[int] = 10

class ChatRequest(BaseModel):
    message: str
    context: str
    chat_history: Optional[List[Dict[str, str]]] = []
    timestamp: datetime = Field(default_factory=datetime.now)

# Response Models
class Flashcard(BaseModel):
    term: str = Field(description="The key term or concept")
    definition: str = Field(description="The definition or explanation of the term")
    example: Optional[str] = Field(None, description="An example to illustrate the concept")

class QuizQuestion(BaseModel):
    question: str = Field(description="The quiz question")
    options: List[str] = Field(description="List of 3 answer options", min_items=3, max_items=3)
    correct_answer: int = Field(description="Index of the correct answer (0-2)", ge=0, le=2)
    explanation: str = Field(description="Explanation of why the answer is correct")

class StructuredCourse(BaseModel):
    title: str = Field(description="Title of the course section")
    introduction: str = Field(description="Brief introduction to the topic")
    sections: List[Dict[str, str]] = Field(description="Main sections of the course content")
    key_points: List[str] = Field(description="Key takeaways from the course")
    summary: str = Field(description="Comprehensive summary of the course")

class ChatResponse(BaseModel):
    message: str
    timestamp: datetime

class ProcessedChapter(BaseModel):
    transcription: str
    course: StructuredCourse
    flashcards: List[Flashcard]
    quiz: List[QuizQuestion]
    key_points: List[str]
    summary: str
